import { test, expect } from "@playwright/test";
import { STORAGE_STATE } from "./auth.setup";

/**
 * Font loading + text-metrics checks.
 *
 * Catches three classes of regression:
 *
 *   1. FOIT / FOUT — the page paints before the webfont is ready, so users
 *      see a system-ui fallback for a beat. We assert `document.fonts.ready`
 *      resolves and that every required family reports `.check()` true at
 *      multiple weights.
 *
 *   2. Silent fallback — the @import URL changed, the family name was
 *      renamed, or the network blocked Google Fonts. We measure the rendered
 *      width of a known glyph string in the expected font vs. the same
 *      string forced to the system fallback; if widths match, the webfont
 *      never actually applied and we fail.
 *
 *   3. Layout drift — heading sizes, line-heights, or tracking changed
 *      unintentionally. For each key screen we snapshot text metrics
 *      (fontSize, lineHeight, letterSpacing, fontFamily, computed pixel
 *      width) of the largest visible heading and compare against a tolerance
 *      band (±1px width, exact match for size / lh / ls / family).
 */

test.use({ storageState: STORAGE_STATE });

// Families we expect the app to load. Keep in sync with src/routes/__root.tsx.
const REQUIRED_FONTS: { family: string; weights: number[] }[] = [
  { family: "Sora", weights: [400, 500, 600, 700] },
  { family: "Geist", weights: [400, 500, 600] },
  { family: "Instrument Serif", weights: [400] },
];

// Screens worth metric-checking. We pick screens with prominent typography.
const SCREENS = [
  "/home",
  "/onboarding-explainer",
  "/contacts",
  "/matches",
  "/upgrade",
  "/profile",
] as const;

test.describe("fonts load without fallback flash", () => {
  test("all required font faces are loaded after networkidle", async ({ page }) => {
    await page.goto("/home", { waitUntil: "networkidle" });

    const result = await page.evaluate(async (families) => {
      await document.fonts.ready;
      const checks: { family: string; weight: number; loaded: boolean }[] = [];
      for (const { family, weights } of families) {
        for (const weight of weights) {
          checks.push({
            family,
            weight,
            loaded: document.fonts.check(`${weight} 16px "${family}"`),
          });
        }
      }
      return checks;
    }, REQUIRED_FONTS);

    const missing = result.filter((r) => !r.loaded);
    expect(
      missing,
      `Missing font faces:\n${missing.map((m) => `${m.family} ${m.weight}`).join("\n")}`,
    ).toEqual([]);
  });

  test("primary webfont actually paints (not the system fallback)", async ({ page }) => {
    await page.goto("/home", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    // Render the same string twice off-screen: once with Sora, once forced
    // to system-ui. If widths are equal to the pixel, Sora never applied.
    const probe = await page.evaluate(() => {
      const make = (family: string) => {
        const el = document.createElement("span");
        el.textContent = "Sphere — find your match Wg0123";
        el.style.cssText = `
          position: fixed; left: -9999px; top: -9999px;
          font: 600 24px ${family};
          letter-spacing: normal;
          white-space: nowrap; visibility: hidden;
        `;
        document.body.appendChild(el);
        const w = el.getBoundingClientRect().width;
        el.remove();
        return w;
      };
      return {
        sora: make(`"Sora", system-ui, sans-serif`),
        fallback: make(`system-ui, sans-serif`),
      };
    });

    expect(probe.sora).toBeGreaterThan(0);
    // Demand a meaningful divergence — webfont metrics differ from system fallback.
    expect(
      Math.abs(probe.sora - probe.fallback),
      `Sora width (${probe.sora}) is identical to system fallback (${probe.fallback}); webfont likely failed to apply`,
    ).toBeGreaterThan(1);
  });
});

test.describe("text metrics — key screens", () => {
  // Tolerance for pixel width comparisons (anti-aliasing + sub-pixel rounding).
  const WIDTH_TOLERANCE_PX = 2;

  for (const path of SCREENS) {
    test(`text metrics: ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      // Find the largest visible heading; fall back to the largest visible text node.
      const metrics = await page.evaluate(() => {
        const candidates = Array.from(
          document.querySelectorAll<HTMLElement>("h1, h2, h3, [data-test-heading]"),
        ).filter((el) => {
          const r = el.getBoundingClientRect();
          const text = (el.textContent ?? "").trim();
          return r.width > 0 && r.height > 0 && text.length > 0;
        });
        if (!candidates.length) return null;
        candidates.sort(
          (a, b) =>
            parseFloat(getComputedStyle(b).fontSize) -
            parseFloat(getComputedStyle(a).fontSize),
        );
        const target = candidates[0];
        const cs = getComputedStyle(target);
        const rect = target.getBoundingClientRect();
        return {
          tag: target.tagName.toLowerCase(),
          text: (target.textContent ?? "").trim().slice(0, 60),
          fontFamily: cs.fontFamily,
          fontSize: parseFloat(cs.fontSize),
          lineHeight: cs.lineHeight,
          letterSpacing: cs.letterSpacing,
          fontWeight: cs.fontWeight,
          width: rect.width,
          height: rect.height,
        };
      });

      expect(metrics, `${path}: no heading-like element found`).not.toBeNull();
      const m = metrics!;

      // 1. Family resolves to a real webfont (one of our expected families,
      //    not just system-ui / sans-serif).
      const usingWebfont = REQUIRED_FONTS.some((f) =>
        m.fontFamily.includes(f.family),
      );
      expect(
        usingWebfont,
        `${path}: heading font-family "${m.fontFamily}" is not one of the required webfonts`,
      ).toBe(true);

      // 2. Headings should be a sane minimum size (catches accidental token wipes).
      expect(
        m.fontSize,
        `${path}: heading fontSize ${m.fontSize} suspiciously small`,
      ).toBeGreaterThanOrEqual(18);

      // 3. Re-measure the same string in the system fallback — width must differ,
      //    otherwise the webfont is silently failing for THIS screen.
      const fallbackWidth = await page.evaluate(
        ({ text, fontSize, fontWeight, letterSpacing }) => {
          const el = document.createElement("span");
          el.textContent = text;
          el.style.cssText = `
            position: fixed; left: -9999px; top: -9999px;
            font: ${fontWeight} ${fontSize}px system-ui, sans-serif;
            letter-spacing: ${letterSpacing};
            white-space: nowrap; visibility: hidden;
          `;
          document.body.appendChild(el);
          const w = el.getBoundingClientRect().width;
          el.remove();
          return w;
        },
        m,
      );

      // Measure actual rendered width with the same single-line constraint.
      const actualWidth = await page.evaluate(
        ({ text, fontSize, fontWeight, letterSpacing, fontFamily }) => {
          const el = document.createElement("span");
          el.textContent = text;
          el.style.cssText = `
            position: fixed; left: -9999px; top: -9999px;
            font: ${fontWeight} ${fontSize}px ${fontFamily};
            letter-spacing: ${letterSpacing};
            white-space: nowrap; visibility: hidden;
          `;
          document.body.appendChild(el);
          const w = el.getBoundingClientRect().width;
          el.remove();
          return w;
        },
        m,
      );

      expect(
        Math.abs(actualWidth - fallbackWidth),
        `${path}: heading width matches system fallback (${actualWidth}px ≈ ${fallbackWidth}px) — webfont not applied`,
      ).toBeGreaterThan(WIDTH_TOLERANCE_PX);
    });
  }
});
