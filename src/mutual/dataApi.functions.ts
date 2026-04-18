// Server functions that own all phone hashing.
//
// The client calls these via RPC and never sees the pepper.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hashPhone, hashPhones } from "@/integrations/phone/hash.server";

function toE164Server(input: string): string {
  const s = String(input ?? "").trim();
  if (!s) return "";
  if (s.startsWith("+")) return "+" + s.slice(1).replace(/\D/g, "");
  const digits = s.replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return digits ? "+" + digits : "";
}

/**
 * Insert "I added this phone" rows. Hashes both my phone and each target
 * phone with the server pepper. Raw phones are never stored.
 */
export const addPhonesServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phones: string[] }) => {
    if (!input || !Array.isArray(input.phones)) {
      throw new Error("phones must be an array");
    }
    if (input.phones.length === 0 || input.phones.length > 500) {
      throw new Error("phones must contain 1–500 entries");
    }
    return { phones: input.phones };
  })
  .handler(async ({ data, context }) => {
    const { userId, claims } = context as {
      userId: string;
      claims: { phone?: string };
    };
    const myPhone = claims?.phone ? `+${String(claims.phone).replace(/\D/g, "")}` : "";
    if (!myPhone) {
      throw new Error("Your account is missing a verified phone number.");
    }
    const myHash = hashPhone(myPhone);

    const targets = Array.from(
      new Set(
        data.phones
          .map(toE164Server)
          .filter((p) => p && p !== myPhone)
      )
    );
    if (targets.length === 0) {
      return { inserted: 0 };
    }
    const targetHashes = hashPhones(targets);

    const rows = targetHashes.map((h) => ({
      adder_id: userId,
      adder_phone_hash: myHash,
      added_phone_hash: h,
    }));

    // Use the user-scoped client (RLS enforces adder_id = auth.uid()).
    const { supabase } = context as any;
    const { error, count } = await supabase
      .from("adds")
      .upsert(rows, {
        onConflict: "adder_phone_hash,added_phone_hash",
        ignoreDuplicates: true,
        count: "exact",
      });
    if (error) {
      // Fall back to admin client if a uniqueness conflict happens at the
      // legacy raw-column unique index (pre-cleanup). We still respect adder_id.
      console.error("addPhones insert error", error);
      throw new Error(error.message);
    }
    return { inserted: count ?? rows.length };
  });

/**
 * One-time backfill: rehash any rows where hash columns are NULL.
 * Uses the admin client to bypass RLS (we re-hash *every* row, regardless
 * of owner — this is intentional during the migration window).
 *
 * Safe to call multiple times — only fills NULL hashes.
 */
export const backfillPhoneHashes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("adds")
      .select("id, adder_phone, added_phone, adder_phone_hash, added_phone_hash")
      .or("adder_phone_hash.is.null,added_phone_hash.is.null")
      .limit(5000);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return { updated: 0 };

    let updated = 0;
    for (const row of data as any[]) {
      const adderHash = row.adder_phone_hash || (row.adder_phone ? hashPhone(row.adder_phone) : null);
      const addedHash = row.added_phone_hash || (row.added_phone ? hashPhone(row.added_phone) : null);
      if (!adderHash || !addedHash) continue;
      const { error: upErr } = await supabaseAdmin
        .from("adds")
        .update({ adder_phone_hash: adderHash, added_phone_hash: addedHash })
        .eq("id", row.id);
      if (!upErr) updated += 1;
    }
    return { updated };
  });

/**
 * Returns the user's matches (as opaque hashes) and pending adds (as hashes).
 * The client maps hashes back to readable numbers using the local set of
 * phones it has uploaded (whose raw values the client already knows).
 */
export const loadAddsAndMatchesServer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const [addsRes, matchesRes] = await Promise.all([
      supabase
        .from("adds")
        .select("added_phone_hash, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("matches")
        .select("other_phone_hash, matched_at")
        .order("matched_at", { ascending: false }),
    ]);
    if (addsRes.error) throw new Error(addsRes.error.message);
    if (matchesRes.error) throw new Error(matchesRes.error.message);

    return {
      adds: (addsRes.data ?? []) as Array<{ added_phone_hash: string; created_at: string }>,
      matches: (matchesRes.data ?? []) as Array<{ other_phone_hash: string; matched_at: string }>,
    };
  });

/** Returns the hash of the caller's own phone — needed for realtime filters. */
export const getMyPhoneHash = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { claims } = context as { claims: { phone?: string } };
    const myPhone = claims?.phone ? `+${String(claims.phone).replace(/\D/g, "")}` : "";
    if (!myPhone) return { hash: "" };
    return { hash: hashPhone(myPhone) };
  });
