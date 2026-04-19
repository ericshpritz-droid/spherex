// On-device contact photo lookup.
//
// Privacy contract:
//   - Photos NEVER leave the device. We only read them from the iOS Contacts
//     store and hold them in memory as data: URLs for the duration of the
//     session.
//   - We key them by the same SHA-256 phone hash the rest of the app uses,
//     so the home screen can do `photoByHash[match.id]` and get back a
//     local image to render.
//
// On web (incl. the Lovable preview), this module is a graceful no-op:
// `loadContactPhotos()` returns an empty Map so cards fall back to the
// gradient `PhoneAvatar`.
import { isNative } from "./platform";

export type ContactPhotoMap = Map<string, string>; // phoneHash -> data: URL

// Normalize a phone string to E.164-ish digits-only the same way the server
// does before hashing. Keep this in sync with `src/integrations/phone/hash.server.ts`.
function normalizePhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  // Strip a leading US country code so "+1 415..." and "415..." hash the same.
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Loads all contacts with photos from the device address book, hashes their
 * phone numbers, and returns a `phoneHash -> data:image/...` map.
 *
 * Returns an empty Map on web or if permission is denied.
 */
export async function loadContactPhotos(): Promise<ContactPhotoMap> {
  const out: ContactPhotoMap = new Map();
  if (!isNative()) return out;

  // Lazy-import so the web bundle never pulls the native plugin's runtime.
  const { Contacts } = await import("@capacitor-community/contacts");

  // Ask for permission. iOS shows the system prompt the first time.
  const perm = await Contacts.requestPermissions();
  if (perm.contacts !== "granted") return out;

  const result = await Contacts.getContacts({
    projection: {
      name: true,
      phones: true,
      image: true, // base64 photo if present
    },
  });

  const contacts = result.contacts ?? [];
  for (const c of contacts) {
    const phones = c.phones ?? [];
    const imageBase64 = c.image?.base64String;
    if (!imageBase64 || phones.length === 0) continue;

    // iOS gives us raw base64 (no data: prefix). Cards expect a usable URL.
    const dataUrl = `data:image/jpeg;base64,${imageBase64}`;

    for (const phone of phones) {
      const num = phone?.number;
      if (!num) continue;
      const normalized = normalizePhone(num);
      if (!normalized) continue;
      try {
        const hash = await sha256Hex(normalized);
        // First photo wins — don't overwrite if multiple contacts share a number.
        if (!out.has(hash)) out.set(hash, dataUrl);
      } catch {
        // Skip on hash failure
      }
    }
  }

  return out;
}
