# iOS Mobile UI — Full-Screen & Keyboard Assessment

## What I see in the TestFlight screenshots

1. **Cream/gray "phone frame" is showing on the real iPhone.** That cream rim with rounded corners is the *desktop preview frame* (`bg-frame`, `borderRadius: 48`, fixed `402×874` inner). It should never appear on a real device.
2. **Dark navy bands above the status bar and below the keyboard.** That's the iOS native window background (`#08041C` from `capacitor.config.ts`) showing because the WebView is being *resized/translated upward by iOS* when the keyboard opens — and the app's own bottom padding shifts up at the same time.
3. **Net effect:** UI "jumps" when the keyboard appears, and the chrome no longer hugs the device edges.

## Root causes

### A. Phone-frame leaks onto native iOS (the cream border)
In `src/routes/_app.tsx`, full-bleed mode is decided by:
```ts
const fullBleed = native || tooSmallForFrame;
```
Two bugs make this evaluate to `false` on first paint and never recover on Capacitor:

- `tooSmallForFrame`'s initial state is read from `window.innerWidth` inside `useState`, but on SSR it's `false`. After hydration React **does not re-run the initializer**, and the `useEffect` only attaches a `resize` listener — it never calls `onResize()` once on mount. So unless the user rotates the device, the value stays `false`.
- `native = isNative()` is recomputed every render, but nothing forces a re-render after Capacitor's bridge attaches. Combined with the above, the desktop frame styling wins.

### B. Keyboard double-shift
- `capacitor.config.ts` sets `Keyboard.resize: "native"` — iOS pushes the entire WebView up when the keyboard appears.
- At the same time, every form screen pads its footer with `var(--kb-inset)` from `useKeyboardInset` (which also reacts to the keyboard).
- Both compensations stack → the input/CTA jumps further than the keyboard height, exposing the dark iOS background underneath.

### C. Status-bar / safe-area gaps
- `StatusBar.overlaysWebView: true` + `contentInset: "never"` is correct, but the outer wrapper uses `bg-black` while individual screens use `bg-paper`/`bg-ink`. The body itself has no themed background, so any sliver outside the screen container shows the native window color (dark navy), not the screen color.

### D. `100vh` vs `100dvh` on the inner frame
The inner frame still uses `height: min(874px, 100vh)`. `100vh` on iOS Safari/WebView includes the URL bar area and doesn't shrink with the keyboard, while the outer wrapper uses `100dvh`. Mismatch contributes to the visible gap.

## Fix plan (one PR, all frontend/shell)

1. **`src/routes/_app.tsx`**
   - Add a `mounted` state (set in a `useEffect`) and gate frame styling on it so SSR never produces the desktop frame on a phone.
   - In the existing resize `useEffect`, call `onResize()` immediately so `tooSmallForFrame` is correct on mount.
   - Lower the breakpoint to `< 480` (covers iPhone Pro Max + small Android) and also force full-bleed when `nativePlatform() !== "web"`.
   - Replace `100vh` with `100dvh` on the inner frame to match the wrapper.

2. **`capacitor.config.ts`**
   - Switch `Keyboard.resize` from `"native"` to `"none"`. We already manage keyboard offset in CSS via `--kb-inset`; letting iOS also resize the WebView is what causes the double-shift. With `"none"`, the WebView stays full-screen and only our `padding-bottom: var(--kb-inset)` moves.

3. **`src/styles.css`**
   - Set `html, body { background: var(--ink); height: 100%; }` and `body { overscroll-behavior: none; }` so any sliver outside the active screen matches the app, not the iOS window color.
   - Add `:root { --safe-top: env(safe-area-inset-top); --safe-bottom: env(safe-area-inset-bottom); }` for consistent reuse.

4. **`src/sphere/components/SphereScreen.tsx`**
   - Add `min-h-[100dvh]` (when running full-bleed) and `pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]` defaults so every screen owns its safe areas instead of relying on per-screen padding hacks. Screens that already pad their footer with `--kb-inset` keep working; the safe-area padding just guarantees no native background ever peeks through.

5. **Form screens (`_app.phone.tsx`, `_app.code.tsx`, `_app.instagram.tsx`)**
   - With `Keyboard.resize: "none"`, the existing `paddingBottom: calc(max(safe-area, --kb-inset) + 1rem)` becomes the *single* source of vertical adjustment. Verify the spacer `<div className="flex-1 min-h-0" />` pattern (already added on `/phone`) is mirrored on `/code` and `/instagram` so the input never scrolls out of view.

6. **`src/mutual/native/initNative.ts`** *(verify, no change expected)*
   - Confirm `StatusBar.setOverlaysWebView({ overlay: true })` and `Keyboard.setResizeMode({ mode: 'none' })` are called once on boot to match the new config.

## Verification

- Native iOS (TestFlight build): app fills edge-to-edge, no cream frame, no dark navy bands top/bottom; keyboard slides up and only the CTA lifts by exactly the keyboard height.
- iOS Safari (web): same behavior via `visualViewport` fallback already in `useKeyboardInset`.
- Desktop preview ≥ 480px wide: phone frame still renders as before.
- Small Android / narrow viewports: full-bleed.

## Out of scope

- No business-logic, auth, or routing changes.
- No new dependencies.
