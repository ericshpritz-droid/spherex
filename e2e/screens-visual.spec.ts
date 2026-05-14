import { test, expect } from "@playwright/test";
import { STORAGE_STATE } from "./auth.setup";

/**
 * Visual regression baselines for every authenticated screen at mobile and
 * tablet high-resolution. Snapshots are stored next to this spec under
 * `screens-visual.spec.ts-snapshots/`. Update with:
 *
 *   bun playwright test screens-visual --update-snapshots
 *
 * Notes:
 *   - We force `prefers-reduced-motion: reduce` and disable CSS animations
 *     and caret blinking so screenshots are deterministic.
 *   - We freeze `Date.now()` to a fixed instant so any "X minutes ago"
 *     copy renders identically across runs.
 *   - `fullPage: true` captures content below the fold so layout regressions
 *     in long screens (e.g. /sitemap, /matches) are still caught.
 *   - DPR 2 mirrors a real iPhone / iPad retina screen.
 */

test.use({ storageState: STORAGE_STATE });

type Screen = { path: string; note?: string };

const SCREENS: Screen[] = [
  { path: "/home" },
  { path: "/instagram" },
  { path: "/onboarding-explainer" },
  { path: "/onboarding-import" },
  { path: "/contacts" },
  { path: "/add" },
  { path: "/add/intent" },
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
  { path: "/profile/delete" },
  { path: "/admin" },
  { path: "/sitemap" },
  { path: "/test-share" },
];

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },   // iPhone 14 Pro
  { name: "tablet", width: 834, height: 1194 },  // iPad Pro 11"
] as const;

const THEMES = ["light", "dark"] as const;

const FREEZE_DATE = new Date("2026-01-15T12:00:00.000Z").valueOf();

const slug = (p: string) => p.replace(/^\//, "").replace(/[\/]/g, "-") || "root";

for (const viewport of VIEWPORTS) {
  for (const theme of THEMES) {
    test.describe(`${viewport.name} @ ${viewport.width}x${viewport.height} (${theme})`, () => {
      test.use({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 2,
        colorScheme: theme,
      });

      for (const screen of SCREENS) {
        test(`visual: ${screen.path}`, async ({ page }) => {
          // Freeze time + force theme + kill animations before any app code runs.
          await page.addInitScript(
            ({ frozen, theme }) => {
              const OriginalDate = Date;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (globalThis as any).Date = class extends OriginalDate {
                constructor(...args: ConstructorParameters<typeof Date>) {
                  super(...(args.length ? args : [frozen]));
                }
                static now() {
                  return frozen;
                }
              };
              try {
                localStorage.setItem("sphere.theme", theme);
              } catch {}
            },
            { frozen: FREEZE_DATE, theme },
          );

          await page.emulateMedia({ reducedMotion: "reduce", colorScheme: theme });

          await page.goto(screen.path, { waitUntil: "domcontentloaded" });
          await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

          // Strip remaining motion + caret blink so identical pixels round-trip.
          await page.addStyleTag({
            content: `
              *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
                caret-color: transparent !important;
              }
              video { visibility: hidden !important; }
            `,
          });

          // Let fonts settle so text metrics don't shift between runs.
          await page.evaluate(() => document.fonts?.ready);
          await page.waitForTimeout(150);

          await expect(page).toHaveScreenshot(
            `${slug(screen.path)}.png`,
            {
              fullPage: true,
              animations: "disabled",
              caret: "hide",
              maxDiffPixelRatio: 0.01,
            },
          );
        });
      }
    });
  }
}
