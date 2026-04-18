// Server functions that own all phone hashing.
//
// The client calls these via RPC and never sees the pepper.
// IMPORTANT: server-only modules (`*.server.ts`, `supabaseAdmin`, the pepper
// helper) are imported *inside* handler bodies via dynamic `import()` so the
// TanStack import-protection plugin doesn't flag this file when it's reached
// from client-bundled code.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    const { hashPhone, hashPhones } = await import("@/integrations/phone/hash.server");
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

    const { supabase } = context as any;
    const { error, count } = await supabase
      .from("adds")
      .upsert(rows, {
        onConflict: "adder_phone_hash,added_phone_hash",
        ignoreDuplicates: true,
        count: "exact",
      });
    if (error) {
      console.error("addPhones insert error", error);
      throw new Error(error.message);
    }
    return { inserted: count ?? rows.length };
  });

/**
 * No-op stub kept for compatibility with any earlier client builds.
 * The schema no longer has raw phone columns to backfill from.
 */
export const backfillPhoneHashes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return { updated: 0 };
  });

/**
 * Returns the user's matches (as opaque hashes) and pending adds (as hashes).
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

/**
 * Hash a list of E.164 phones using the server pepper, so the client can
 * remember "this hash → this contact's readable number" locally without
 * ever seeing the pepper.
 */
export const hashPhonesServer = createServerFn({ method: "POST" })
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
  .handler(async ({ data }) => {
    const { hashPhones } = await import("@/integrations/phone/hash.server");
    const e164s = data.phones.map(toE164Server).filter(Boolean);
    return { hashes: hashPhones(e164s) };
  });

/** Returns the hash of the caller's own phone — needed for realtime filters. */
export const getMyPhoneHash = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { hashPhone } = await import("@/integrations/phone/hash.server");
    const { claims } = context as { claims: { phone?: string } };
    const myPhone = claims?.phone ? `+${String(claims.phone).replace(/\D/g, "")}` : "";
    if (!myPhone) return { hash: "" };
    return { hash: hashPhone(myPhone) };
  });
