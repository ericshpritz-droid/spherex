// Tiny client-side preference for whether the user wants the app to use their
// device contact photos at all. Independent of the iOS system permission —
// the user can have granted permission but still flip this off in-app.
const KEY = "sphere.contactPhotos.enabled";

export function getContactPhotosEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = window.localStorage.getItem(KEY);
    // Default ON — if the user has granted permission, show photos.
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

export function setContactPhotosEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, enabled ? "1" : "0");
    // Notify any listening hooks in this tab.
    window.dispatchEvent(new CustomEvent("sphere:contact-photos-pref"));
  } catch {
    /* ignore */
  }
}
