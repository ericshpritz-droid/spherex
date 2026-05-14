import { test, expect, type Request } from "@playwright/test";

/**
 * End-to-end: drive the full /phone → /code → /instagram → /onboarding-explainer
 * → /home flow with test mode ON, and assert Twilio is never contacted.
 *
 * Pre-req: `app_settings.test_mode = true` in the Supabase project. The test
 * fails fast with a helpful message if it isn't.
 *
 * Run:
 *   bun playwright test                          # against localhost:5173
 *   PLAYWRIGHT_BASE_URL=https://...lovable.app bun playwright test
 */

const SUPABASE_URL = "https://llbwvnnrzuewzmfmzgnd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYnd2bm5yenVld3ptZm16Z25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODIxNDQsImV4cCI6MjA5MjA1ODE0NH0.TJol3S2QvHZnI7X6OxkNmL9JPiAOohY5SXRVwETxigk";

// This spec walks /phone → /code itself, so don't reuse the saved auth state.
test.use({ storageState: { cookies: [], origins: [] } });

const TWILIO_PATTERNS = [/Messages\.json/i, /\/twilio\//i];

function isTwilio(req: Request): boolean {
  const url = req.url();
  return TWILIO_PATTERNS.some((p) => p.test(url));
}

test.beforeAll(async ({ request }) => {
  const res = await request.get(
    `${SUPABASE_URL}/rest/v1/app_settings?select=test_mode&id=eq.1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        accept: "application/vnd.pgrst.object+json",
      },
    },
  );
  expect(res.ok(), "Could not read app_settings.test_mode").toBeTruthy();
  const body = await res.json();
  expect(
    body.test_mode,
    "Test mode is OFF — flip app_settings.test_mode = true in Lovable Cloud before running this E2E.",
  ).toBe(true);
});

test("test-mode onboarding: /welcome → /home, zero Twilio calls", async ({
  page,
}) => {
  const twilioHits: string[] = [];
  page.on("request", (req) => {
    if (isTwilio(req)) twilioHits.push(req.url());
  });

  // Unique phone per run so we get a fresh synthetic account.
  const tail = String(Date.now()).slice(-7).padStart(7, "0");
  const phoneDigits = `555${tail}`; // 10 digits, NANP-ish
  const verifyCode = "111111";

  // ── /welcome ────────────────────────────────────────────────────────────
  await page.goto("/welcome");
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByRole("button", { name: /get started/i }).first().click();

  // ── /phone ──────────────────────────────────────────────────────────────
  await expect(page).toHaveURL(/\/phone$/);
  await expect(page.getByText(/TEST MODE/i).first()).toBeVisible();
  const phoneInput = page.getByRole("textbox").first();
  await phoneInput.click();
  await phoneInput.fill(phoneDigits);
  await page.getByRole("button", { name: /send code/i }).click();

  // ── /code ───────────────────────────────────────────────────────────────
  await expect(page).toHaveURL(/\/code$/);
  await expect(page.getByText(/TEST MODE/i).first()).toBeVisible();
  await expect(page.getByText(verifyCode)).toBeVisible(); // hint shows 111111
  const codeInput = page.getByLabel(/6-digit verification code/i);
  await codeInput.fill(verifyCode);
  // Code may auto-submit on 6 digits; tap Confirm if still on /code.
  if (/\/code$/.test(page.url())) {
    const confirm = page.getByRole("button", { name: /confirm/i });
    if (await confirm.isEnabled().catch(() => false)) await confirm.click();
  }

  // ── /instagram ──────────────────────────────────────────────────────────
  await page.waitForURL(/\/instagram$/, { timeout: 15_000 });
  // Skip the handle to keep the test deterministic.
  await page.getByRole("button", { name: /skip.*only my number/i }).click();

  // ── /onboarding-explainer ───────────────────────────────────────────────
  await page.waitForURL(/\/onboarding-explainer$/, { timeout: 15_000 });
  // Either the Skip pill or the × dismiss button advances to /home.
  const skipButton = page.getByRole("button", { name: /^skip$/i }).first();
  const closeButton = page.getByRole("button", { name: /close/i }).first();
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  } else {
    await closeButton.click();
  }

  // ── /home ───────────────────────────────────────────────────────────────
  await page.waitForURL(/\/home$/, { timeout: 15_000 });

  // ── Twilio guard ────────────────────────────────────────────────────────
  // Give any in-flight request a beat to settle, then assert.
  await page.waitForTimeout(500);
  expect(
    twilioHits,
    `Twilio was called during a test-mode run:\n${twilioHits.join("\n")}`,
  ).toEqual([]);
});
