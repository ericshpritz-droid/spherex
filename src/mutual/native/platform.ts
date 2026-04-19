// Tiny wrapper around Capacitor so the rest of the app can branch on
// "are we running inside the native iOS shell?" without importing Capacitor
// in a hundred places. Safe to call from SSR — guards `window`.
import { Capacitor } from "@capacitor/core";

export function isNative(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function nativePlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  try {
    const p = Capacitor.getPlatform();
    if (p === "ios" || p === "android") return p;
    return "web";
  } catch {
    return "web";
  }
}
