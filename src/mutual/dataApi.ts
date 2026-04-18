import { toE164, formatE164 } from "./auth";
import { callAddPhones, callLoadAddsAndMatches } from "./dataApi.rpc";

export type Person = {
  phone: string; // formatted "(555) 123-4567"
  name: string;
  status: "matched" | "pending";
  matchedAt?: string;
  avatar: "pink" | "lavender" | "blue";
  unknown?: boolean;
  /** Stable per-person identifier (the server-side hash). */
  id: string;
};

const AVATARS: Person["avatar"][] = ["pink", "lavender", "blue"];
function avatarForId(id: string): Person["avatar"] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) >>> 0;
  return AVATARS[h % 3];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d >= 7) return `${Math.floor(d / 7)}w`;
  if (d >= 1) return `${d}d`;
  const h = Math.floor(diff / 3600000);
  if (h >= 1) return `${h}h`;
  return "now";
}

/**
 * Load matches + still-pending adds for the current user.
 *
 * `hashToRaw` is a *local* lookup of phones the current device has previously
 * uploaded. We only know readable numbers for people *we* added. Hashes that
 * aren't in this map render as a generic "Hidden contact" placeholder.
 */
export async function loadAddsAndMatches(
  _myPhoneE164: string,
  hashToRaw?: Map<string, string>,
): Promise<{ matches: Person[]; pending: Person[] }> {
  const { adds, matches } = await callLoadAddsAndMatches();
  const matchedHashes = new Set(matches.map((m) => m.other_phone_hash));

  function makePerson(hash: string, status: "matched" | "pending", matchedAt?: string): Person {
    const raw = hashToRaw?.get(hash);
    const formatted = raw ? formatE164(raw) : "Hidden contact";
    return {
      id: hash,
      phone: formatted,
      name: formatted,
      status,
      matchedAt,
      avatar: avatarForId(hash),
      unknown: true,
    };
  }

  return {
    matches: matches.map((m) => makePerson(m.other_phone_hash, "matched", timeAgo(m.matched_at))),
    pending: adds
      .filter((a) => !matchedHashes.has(a.added_phone_hash))
      .map((a) => makePerson(a.added_phone_hash, "pending")),
  };
}

/**
 * Insert one or more "I added them" rows. Hashing happens server-side.
 * Returns the E.164 phones that were sent (for local hash-cache hydration).
 */
export async function addPhones(myPhoneE164: string, phones: string[]): Promise<string[]> {
  const e164s = Array.from(
    new Set(
      phones
        .map((p) => toE164(p))
        .filter((p) => p && p !== myPhoneE164),
    ),
  );
  if (e164s.length === 0) return [];
  await callAddPhones(e164s);
  return e164s;
}
