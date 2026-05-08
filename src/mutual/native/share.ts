// Native share sheet wrapper. Falls back to navigator.share / clipboard on web.
import { isNative } from "./platform";

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

export async function nativeShare(opts: ShareOptions): Promise<boolean> {
  if (isNative()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: opts.title,
        text: opts.text,
        url: opts.url,
        dialogTitle: opts.dialogTitle ?? opts.title,
      });
      return true;
    } catch {
      return false;
    }
  }
  // Web fallback
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await (navigator as Navigator & { share: (d: ShareOptions) => Promise<void> }).share({
        title: opts.title,
        text: opts.text,
        url: opts.url,
      });
      return true;
    } catch {
      // user canceled
    }
  }
  if (opts.url && typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(opts.url);
      return true;
    } catch {}
  }
  return false;
}
