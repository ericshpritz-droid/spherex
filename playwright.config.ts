import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the Sphere E2E suite.
 *
 * Defaults to the local dev server at http://localhost:5173. Override with
 *   PLAYWRIGHT_BASE_URL=https://id-preview--<id>.lovable.app bun playwright test
 * to run against a deployed preview.
 *
 * Project layout:
 *   - "setup"           — runs e2e/auth.setup.ts once, signs in via test mode,
 *                         and writes storage state to e2e/.auth/state.json.
 *   - "mobile-chromium" — every other spec; depends on "setup" and reuses the
 *                         saved storage state so we only walk auth once per run.
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
    viewport: { width: 390, height: 844 },
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-chromium",
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        storageState: "e2e/.auth/state.json",
      },
      dependencies: ["setup"],
    },
  ],
});
