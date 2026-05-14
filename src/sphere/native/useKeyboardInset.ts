// Capacitor Keyboard → CSS var `--kb-inset` so any screen can lift its
// bottom CTA above the keyboard with `style={{ paddingBottom: 'var(--kb-inset, 0px)' }}`
// or the `pb-kb` utility. Also fires on visualViewport for web.
import { useEffect } from "react";
import { isNative } from "@/mutual/native/platform";

let installed = false;

function setInset(px: number) {
  document.documentElement.style.setProperty("--kb-inset", `${Math.max(0, px)}px`);
}

export function installKeyboardInset() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  setInset(0);

  if (isNative()) {
    void (async () => {
      try {
        const { Keyboard } = await import("@capacitor/keyboard");
        Keyboard.addListener("keyboardWillShow", (info) => setInset(info.keyboardHeight ?? 280));
        Keyboard.addListener("keyboardDidShow", (info) => setInset(info.keyboardHeight ?? 280));
        Keyboard.addListener("keyboardWillHide", () => setInset(0));
        Keyboard.addListener("keyboardDidHide", () => setInset(0));
      } catch {}
    })();
    return;
  }

  // Web fallback: visualViewport tracks software keyboards on mobile Safari/Chrome.
  const vv = window.visualViewport;
  if (!vv) return;
  const update = () => {
    const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    setInset(inset);
  };
  vv.addEventListener("resize", update);
  vv.addEventListener("scroll", update);
}

export function useKeyboardInset() {
  useEffect(() => {
    installKeyboardInset();
  }, []);
}
