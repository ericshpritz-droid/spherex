import { test, expect, type ConsoleMessage, type Request } from "@playwright/test";
import { STORAGE_STATE } from "./auth.setup";

/**
 * Per-screen smoke test: load every authenticated route as a signed-in
 * test-mode user and assert:
 *   1. no console errors,
 *   2. no Twilio requests (test mode must short-circuit Twilio everywhere),
 *   3. the page renders something (not the blank-page placeholder),
 *   4. the URL did not bounce back to /welcome (auth still valid).
 *
 * Routes that need params or have destructive side effects are skipped or
 * tagged. Add new routes to SCREENS as you ship them.
 */

test.use({ storageState: STORAGE_STATE });

type Screen = { path: string; note?: string };

// Authenticated routes only. /welcome, /phone, /code are covered by the
// dedicated test-mode-onboarding spec.
const SCREENS: Screen[] = [
  { path: "/home" },
  { path: "/instagram" },
  { path: "/onboarding-explainer" },
  { path: "/onboarding-import" },
  { path: "/contacts" },
  { path: "/add" },
  { path: "/add/compose" },
  { path: "/add/manual" },
  { path: "/add/confirm" },
  { path: "/add/patience" },
  { path: "/matches" },
  { path: "/match" },
  { path: "/sent" },
  { path: "/upgrade" },
  { path: "/profile" },
  { path: "/profile/invite" },
  { path: "/profile/delete", note: "renders confirm UI; do NOT click delete" },
  { path: "/admin" },
  { path: "/sitemap" },
  { path: "/test-share" },
  // /thread/$hash needs a valid mutual hash — skip in smoke; cover separately.
];

const TWILIO_PATTERNS = [/Messages\.json/i, /\/twilio\//i];
const isTwilio = (req: Request) => TWILIO_PATTERNS.some((p) => p.test(req.url()));

// Console errors we tolerate (third-party noise that's not actionable).
const IGNORED_CONSOLE = [
  /Download the React DevTools/i,
  /\[vite\]/i,
  /Switched to client rendering/i,
  /RESET_BLANK_CHECK/i,
];

const isIgnorable = (msg: ConsoleMessage) =>
  msg.type() !== "error" || IGNORED_CONSOLE.some((p) => p.test(msg.text()));

for (const screen of SCREENS) {
  test(`screen renders: ${screen.path}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const twilioHits: string[] = [];

    page.on("console", (msg) => {
      if (!isIgnorable(msg)) consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on("pageerror", (err) => consoleErrors.push(`[pageerror] ${err.message}`));
    page.on("request", (req) => {
      if (isTwilio(req)) twilioHits.push(req.url());
    });

    const response = await page.goto(screen.path, { waitUntil: "domcontentloaded" });
    expect(response, `no response for ${screen.path}`).not.toBeNull();

    // Auth still valid — we did not get punted back to /welcome.
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    expect(
      page.url(),
      `auth lost while loading ${screen.path}`,
    ).not.toMatch(/\/welcome$/);

    // Page rendered something real — not the blank-page placeholder.
    const placeholder = await page
      .locator("[data-lovable-blank-page-placeholder]")
      .count();
    expect(placeholder, `${screen.path} shows blank-page placeholder`).toBe(0);

    // Body has visible content.
    const bodyText = (await page.locator("body").innerText()).trim();
    expect(bodyText.length, `${screen.path} rendered empty body`).toBeGreaterThan(0);

    // Twilio guard.
    expect(
      twilioHits,
      `Twilio called from ${screen.path}:\n${twilioHits.join("\n")}`,
    ).toEqual([]);

    // Console clean.
    expect(
      consoleErrors,
      `Console errors on ${screen.path}:\n${consoleErrors.join("\n")}`,
    ).toEqual([]);
  });
}
