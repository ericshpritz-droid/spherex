// Unified haptics: native iOS taptic engine via Capacitor on device,
// `navigator.vibrate` fallback on web/Android browser. All calls are
// fire-and-forget and never throw — UI code can sprinkle them without try/catch.
//
// Honors the user's in-app "Reduce haptics" preference: when disabled, every
// method becomes a no-op (we don't even load the native module).
import { isNative } from "./platform";
import { getHapticsEnabled } from "./hapticsPref";

type Native = typeof import("@capacitor/haptics");
let nativeMod: Native | null = null;
let nativeLoadAttempted = false;

async function getNative(): Promise<Native | null> {
  if (!isNative()) return null;
  if (nativeMod) return nativeMod;
  if (nativeLoadAttempted) return null;
  nativeLoadAttempted = true;
  try {
    nativeMod = await import("@capacitor/haptics");
    return nativeMod;
  } catch {
    return null;
  }
}

function webVibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    /* ignore */
  }
}

function fire(nativeFn: (m: Native) => Promise<unknown>, fallback: number | number[]) {
  if (!getHapticsEnabled()) return;
  getNative().then((m) => {
    if (m) nativeFn(m).catch(() => {});
    else webVibrate(fallback);
  });
}

export const haptics = {
  /** Tiny tick. Use for button taps, toggles, selection changes. */
  light() {
    fire((m) => m.Haptics.impact({ style: m.ImpactStyle.Light }), 8);
  },
  /** Medium thump. Use for confirming a meaningful action. */
  medium() {
    fire((m) => m.Haptics.impact({ style: m.ImpactStyle.Medium }), 14);
  },
  /** Strong thump. Use sparingly. */
  heavy() {
    fire((m) => m.Haptics.impact({ style: m.ImpactStyle.Heavy }), 22);
  },
  /** Selection tick — subtler than `light()`, for picker-style UI. */
  selection() {
    fire((m) => m.Haptics.selectionStart().then(() => m.Haptics.selectionEnd()), 6);
  },
  /** iOS notification: success (rising double tap). */
  success() {
    fire((m) => m.Haptics.notification({ type: m.NotificationType.Success }), 10);
  },
  /** iOS notification: warning. */
  warning() {
    fire((m) => m.Haptics.notification({ type: m.NotificationType.Warning }), [10, 30, 10]);
  },
  /** iOS notification: error (sharp triple). */
  error() {
    fire((m) => m.Haptics.notification({ type: m.NotificationType.Error }), [10, 40, 10]);
  },
};
