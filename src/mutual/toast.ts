import { toast as sonner } from "sonner";
import { haptics } from "./native/haptics";

type ToastArgs = Parameters<typeof sonner.success>;

/**
 * Sonner's `toast` with a native taptic on supported devices.
 * - success: iOS success notification haptic
 * - error: iOS error notification haptic
 */
export const toast = Object.assign(
  (...args: Parameters<typeof sonner>) => sonner(...args),
  {
    success: (...args: ToastArgs) => {
      haptics.success();
      return sonner.success(...args);
    },
    error: (...args: ToastArgs) => {
      haptics.error();
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
