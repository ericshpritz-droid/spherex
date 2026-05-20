import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Sign in once via test mode and persist the storage state. Every other spec
 * reuses this state via `use: { storageState: STORAGE_STATE }` (set in
 * playwright.config.ts), so we only walk /phone → /code one time per run.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const STORAGE_STATE = path.join(__dirname, ".auth/state.json");

setup("authenticate via test mode", async ({ page }) => {
  // Unique synthetic phone so we get a fresh account each suite run.
  const tail = String(Date.now()).slice(-7).padStart(7, "0");
  const phoneDigits = `555${tail}`;

  await page.goto("/welcome");
  await page.getByRole("button", { name: /get started/i }).first().click();

  await expect(page).toHaveURL(/\/phone$/);
  const phoneInput = page.getByRole("textbox").first();
  await phoneInput.click();
  await phoneInput.fill(phoneDigits);
  await page.getByRole("button", { name: /send code/i }).click();

  await expect(page).toHaveURL(/\/code$/);
  await page.getByLabel(/6-digit verification code/i).fill("111111");
  if (/\/code$/.test(page.url())) {
    const confirm = page.getByRole("button", { name: /confirm/i });
    if (await confirm.isEnabled().catch(() => false)) await confirm.click();
  }

  // Land somewhere authenticated (instagram for new users, home for existing).
  await page.waitForURL(/\/(instagram|home)$/, { timeout: 15_000 });

  await page.context().storageState({ path: STORAGE_STATE });
});
