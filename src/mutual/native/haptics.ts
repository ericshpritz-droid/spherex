// Unified haptics: native iOS taptic engine via Capacitor on device,
// `navigator.vibrate` fallback on web/Android browser. All calls are
// fire-and-forget and never throw — UI code can sprinkle them without try/catch.
import { isNative } from "./platform";

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

export const haptics = {
  /** Tiny tick. Use for button taps, toggles, selection changes. */
  light() {
    getNative().then((m) => {
      if (m) m.Haptics.impact({ style: m.ImpactStyle.Light }).catch(() => {});
      else webVibrate(8);
    });
  },
  /** Medium thump. Use for confirming a meaningful action. */
  medium() {
    getNative().then((m) => {
      if (m) m.Haptics.impact({ style: m.ImpactStyle.Medium }).catch(() => {});
      else webVibrate(14);
    });
  },
  /** Strong thump. Use sparingly. */
  heavy() {
    getNative().then((m) => {
      if (m) m.Haptics.impact({ style: m.ImpactStyle.Heavy }).catch(() => {});
      else webVibrate(22);
    });
  },
  /** Selection tick — subtler than `light()`, for picker-style UI. */
  selection() {
    getNative().then((m) => {
      if (m) m.Haptics.selectionStart().then(() => m.Haptics.selectionEnd()).catch(() => {});
      else webVibrate(6);
    });
  },
  /** iOS notification: success (rising double tap). */
  success() {
    getNative().then((m) => {
      if (m) m.Haptics.notification({ type: m.NotificationType.Success }).catch(() => {});
      else webVibrate(10);
    });
  },
  /** iOS notification: warning. */
  warning() {
    getNative().then((m) => {
      if (m) m.Haptics.notification({ type: m.NotificationType.Warning }).catch(() => {});
      else webVibrate([10, 30, 10]);
    });
  },
  /** iOS notification: error (sharp triple). */
  error() {
    getNative().then((m) => {
      if (m) m.Haptics.notification({ type: m.NotificationType.Error }).catch(() => {});
      else webVibrate([10, 40, 10]);
    });
  },
};
