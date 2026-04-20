// Tiny client-side preference for whether the app should fire haptic feedback.
// Independent of the iOS system "Reduce Motion" / system haptics settings —
// a user can disable haptics in-app without diving into iOS Settings.
const KEY = "sphere.haptics.enabled";
const EVT = "sphere:haptics-pref";

export function getHapticsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = window.localStorage.getItem(KEY);
    // Default ON — haptics are part of the native feel.
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, enabled ? "1" : "0");
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* ignore */
  }
}

export function onHapticsPrefChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}
