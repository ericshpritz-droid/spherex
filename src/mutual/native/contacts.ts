// Native contacts picker. Uses @capacitor-community/contacts on iOS
// (requesting NSContactsUsageDescription on first call), and falls back to
// the Web Contact Picker API (`navigator.contacts.select`) when running in a
// browser that supports it. Returns a normalized list of { name, phone }.
import { isNative, nativePlatform } from "./platform";

/**
 * Open the platform's app settings page so the user can grant Contacts
 * permission after they previously denied it. iOS uses the `app-settings:`
 * URL scheme; the web has no equivalent and resolves false.
 */
export async function openAppSettings(): Promise<boolean> {
  if (!isNative()) return false;
  // Capacitor 8 dropped App.openUrl. Opening a system URL scheme via
  // window.open lets the iOS WebView hand it off to the OS, which routes
  // `app-settings:` to this app's page in Settings.app.
  const url = nativePlatform() === "ios" ? "app-settings:" : "package:";
  try {
    if (typeof window !== "undefined") {
      window.open(url, "_system");
      return true;
    }
  } catch {}
  return false;
}

export interface PickedContact {
  name: string;
  phone: string;
}

export interface ContactsCapability {
  /** A picker is available in the current runtime (native or web). */
  available: boolean;
  /** Native iOS Contacts picker (requires NSContactsUsageDescription). */
  native: boolean;
}

export function contactsCapability(): ContactsCapability {
  if (isNative() && nativePlatform() === "ios") {
    return { available: true, native: true };
  }
  if (
    typeof navigator !== "undefined" &&
    // @ts-expect-error — Web Contact Picker is not in lib.dom yet
    navigator.contacts &&
    // @ts-expect-error
    typeof navigator.contacts.select === "function"
  ) {
    return { available: true, native: false };
  }
  return { available: false, native: false };
}

// Use the canonical NANP normalizer/validator so the picker silently drops
// numbers that wouldn't survive the manual-entry validation either
// (international numbers, N11 service codes, malformed entries).
import { normalizeNanp, isValidNanp } from "../phone/nanp";

function normalizePhone(raw: string): string {
  return normalizeNanp(raw);
}

/**
 * Open the platform contacts picker. Resolves with the picked contacts, or an
 * empty array if the user cancelled. Throws only on permission denial so the
 * caller can show an explanatory toast.
 */
export async function pickContacts(): Promise<PickedContact[]> {
  const cap = contactsCapability();
  if (!cap.available) return [];

  if (cap.native) {
    const { Contacts } = await import("@capacitor-community/contacts");

    // Request permission. iOS will show the system prompt the first time
    // and read NSContactsUsageDescription from Info.plist.
    const perm = await Contacts.requestPermissions();
    if (perm.contacts !== "granted" && perm.contacts !== "limited") {
      const err = new Error("Contacts permission denied");
      (err as Error & { code?: string }).code = "permission-denied";
      throw err;
    }

    // Use the native iOS picker UI (CNContactPickerViewController). The user
    // explicitly taps the contacts they want — we never enumerate the address
    // book ourselves.
    try {
      const result = await Contacts.pickContact({
        projection: { name: true, phones: true },
      });
      const c = result?.contact;
      if (!c) return [];
      const display =
        c.name?.display ??
        [c.name?.given, c.name?.family].filter(Boolean).join(" ").trim();
      const phones = (c.phones ?? [])
        .map((p) => normalizePhone(p?.number ?? ""))
        .filter((p) => p.length === 10);
      // De-duplicate
      const seen = new Set<string>();
      const out: PickedContact[] = [];
      for (const p of phones) {
        if (seen.has(p)) continue;
        seen.add(p);
        out.push({ name: display || "", phone: p });
      }
      return out;
    } catch {
      // User cancelled the picker — treat as empty selection.
      return [];
    }
  }

  // Web Contact Picker fallback (Chrome on Android, some PWAs).
  try {
    // @ts-expect-error — see capability check above
    const results: Array<{ name?: string[]; tel?: string[] }> = await navigator.contacts.select(
      ["name", "tel"],
      { multiple: true },
    );
    const out: PickedContact[] = [];
    const seen = new Set<string>();
    for (const r of results) {
      const tels = Array.isArray(r.tel) ? r.tel : [];
      const names = Array.isArray(r.name) ? r.name : [];
      const display = (names.find(Boolean) || "").toString().trim();
      for (const t of tels) {
        const phone = normalizePhone(String(t || ""));
        if (phone.length !== 10 || seen.has(phone)) continue;
        seen.add(phone);
        out.push({ name: display, phone });
      }
    }
    return out;
  } catch {
    return [];
  }
}
