import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the Sphere onboarding E2E.
 *
 * Defaults to the local dev server at http://localhost:5173. Override with
 *   PLAYWRIGHT_BASE_URL=https://id-preview--<id>.lovable.app bun playwright test
 * to run against a deployed preview. We do NOT auto-start the dev server here
 * (the Lovable sandbox already runs it); set webServer locally if you want to.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    viewport: { width: 390, height: 844 }, // iPhone 14-ish
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
