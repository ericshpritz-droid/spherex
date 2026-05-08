// Per-screen status bar tinting. Drop into any route to set the bar style
// while the screen is mounted; restores Dark on unmount.
import { useEffect } from "react";
import { isNative } from "./platform";

export type StatusBarStyle = "dark" | "light";

export function useStatusBar(style: StatusBarStyle = "dark"): void {
  useEffect(() => {
    if (!isNative()) return;
    let mounted = true;
    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        if (!mounted) return;
        await StatusBar.setStyle({
          style: style === "light" ? Style.Light : Style.Dark,
        });
      } catch {}
    })();
    return () => {
      mounted = false;
      void (async () => {
        try {
          const { StatusBar, Style } = await import("@capacitor/status-bar");
          await StatusBar.setStyle({ style: Style.Dark });
        } catch {}
      })();
    };
  }, [style]);
}
