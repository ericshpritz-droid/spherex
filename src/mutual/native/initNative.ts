// One-shot native shell initialization. Called from __root.tsx after we
// confirm we're inside Capacitor. Safe no-ops on web.
import { isNative } from "./platform";

let initialized = false;

export async function initNativeShell(): Promise<void> {
  if (initialized || !isNative()) return;
  initialized = true;

  // Tag <html> so CSS can lock the viewport.
  document.documentElement.classList.add("capacitor-native");

  // Belt to the Info.plist suspenders: ask the browser/WebView to stay
  // portrait. iOS enforces this via Info.plist UISupportedInterfaceOrientations;
  // this catches any web-side rotation observers (visualViewport, CSS @media
  // (orientation: landscape)) and keeps Android/web consistent.
  try {
    const orientation = (screen as any)?.orientation;
    if (orientation?.lock) {
      await orientation.lock("portrait").catch(() => {});
    }
  } catch {}

  // Status bar: dark content area, our background, overlay so safe-area CSS
  // controls spacing.
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {}

  // Keyboard: don't let iOS resize the WebView — we manage the offset ourselves
  // via --kb-inset so layout shifts exactly once.
  try {
    const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
    await Keyboard.setResizeMode({ mode: KeyboardResize.None });
    await Keyboard.setScroll({ isDisabled: true });
    Keyboard.addListener("keyboardWillShow", () => {
      document.documentElement.classList.add("kb-open");
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.classList.remove("kb-open");
    });
  } catch {}

  // Hardware/system back button — let the router handle it on Android, no-op iOS.
  try {
    const { App } = await import("@capacitor/app");
    App.addListener("backButton", () => {
      if (window.history.length > 1) window.history.back();
    });
  } catch {}

  // Belt & suspenders: kill document-level touchmove that would bounce the
  // WebView itself, but allow scroll inside any element that *can* scroll
  // (overflow auto/scroll, inputs, contenteditable, opt-in [data-scroll]).
  const isScrollable = (el: HTMLElement): boolean => {
    let node: HTMLElement | null = el;
    while (node && node !== document.body) {
      const s = getComputedStyle(node);
      const oy = s.overflowY;
      if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  };
  document.addEventListener(
    "touchmove",
    (e) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest("input, textarea, [contenteditable], [data-scroll]")) return;
      if (isScrollable(t)) return;
      if (e.cancelable) e.preventDefault();
    },
    { passive: false },
  );

  // Disable iOS double-tap-to-zoom & pinch-zoom gestures globally.
  document.addEventListener("gesturestart", (e) => e.preventDefault());

  // Kill iOS form-zoom on focus (any input < 16px font triggers zoom).
  // Belt: viewport meta is also locked to maximum-scale=1 in __root.tsx.
  document.addEventListener(
    "touchend",
    (e) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    },
    { passive: true },
  );

  // Hide the launch splash once React has painted. Small delay so the first
  // frame is real content, not a white flash.
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void SplashScreen.hide({ fadeOutDuration: 250 });
      });
    });
  } catch {}
}
