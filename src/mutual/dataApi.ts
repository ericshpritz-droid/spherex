import { supabase } from "@/integrations/supabase/client";
import { toE164, formatE164 } from "./auth";

export type Person = {
  phone: string; // formatted "(555) 123-4567"
  name: string;
  status: "matched" | "pending";
  matchedAt?: string;
  avatar: "pink" | "lavender" | "blue";
  unknown?: boolean;
};

const AVATARS: Person["avatar"][] = ["pink", "lavender", "blue"];
function avatarFor(phone: string): Person["avatar"] {
  const h = phone.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
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

/** Load matches + still-pending adds for the current user. */
export async function loadAddsAndMatches(myPhoneE164: string): Promise<{
  matches: Person[];
  pending: Person[];
}> {
  const [addsRes, matchesRes] = await Promise.all([
    supabase
      .from("adds")
      .select("added_phone, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("matches")
      .select("other_phone, matched_at")
      .order("matched_at", { ascending: false }),
  ]);

  if (addsRes.error) throw addsRes.error;
  if (matchesRes.error) throw matchesRes.error;

  const matchedSet = new Set(
    (matchesRes.data ?? []).map((m: any) => m.other_phone as string),
  );

  const matches: Person[] = (matchesRes.data ?? []).map((m: any) => {
    const formatted = formatE164(m.other_phone);
    return {
      phone: formatted,
      name: formatted,
      status: "matched",
      matchedAt: timeAgo(m.matched_at),
      avatar: avatarFor(m.other_phone),
      unknown: true,
    };
  });

  const pending: Person[] = (addsRes.data ?? [])
    .filter((a: any) => !matchedSet.has(a.added_phone))
    .map((a: any) => {
      const formatted = formatE164(a.added_phone);
      return {
        phone: formatted,
        name: formatted,
        status: "pending",
        avatar: avatarFor(a.added_phone),
        unknown: true,
      };
    });

  return { matches, pending };
}

/** Insert one or more "I added them" rows. Ignores duplicates. */
export async function addPhones(myPhoneE164: string, phones: string[]) {
  const rows = phones
    .map((p) => toE164(p))
    .filter((p) => p && p !== myPhoneE164)
    .map((p) => ({ adder_phone: myPhoneE164, added_phone: p }));

  if (rows.length === 0) return;

  // Need adder_id for RLS — get it from session
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const withId = rows.map((r) => ({ ...r, adder_id: userId }));

  // Upsert-style: ignore duplicates via the unique index
  const { error } = await supabase.from("adds").upsert(withId, {
    onConflict: "adder_phone,added_phone",
    ignoreDuplicates: true,
  });
  if (error) throw error;
}
