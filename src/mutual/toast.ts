import { toast as sonner } from "sonner";

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    /* ignore */
  }
}

type ToastArgs = Parameters<typeof sonner.success>;

/**
 * Sonner's `toast` with a subtle haptic tick on supported devices.
 * - success: single 10ms tick
 * - error: short double-pulse so it feels distinct
 */
export const toast = Object.assign(
  (...args: Parameters<typeof sonner>) => sonner(...args),
  {
    success: (...args: ToastArgs) => {
      vibrate(10);
      return sonner.success(...args);
    },
    error: (...args: ToastArgs) => {
      vibrate([10, 40, 10]);
      return sonner.error(...args);
    },
    message: sonner.message,
    info: sonner.info,
    warning: sonner.warning,
    loading: sonner.loading,
    promise: sonner.promise,
    dismiss: sonner.dismiss,
    custom: sonner.custom,
  }
);
