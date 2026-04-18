// Server functions for the invite-link flow.
//
// /i/$hash captures an inviter's *hashed* phone in sessionStorage. After a
// fresh user signs in, AppContext calls `consumeInviteServer` which inserts
// a one-sided add (inviter → me) so the new user immediately has a pending
// connection to the friend who invited them.
//
// We keep this one-sided on purpose: the new user must still independently
// add the inviter back for it to become a mutual.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const consumeInviteServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { inviterHash: string }) => {
    if (!input || typeof input.inviterHash !== "string") {
      throw new Error("inviterHash required");
    }
    const h = input.inviterHash.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(h)) {
      throw new Error("inviterHash must be a 64-char sha256 hex string");
    }
    return { inviterHash: h };
  })
  .handler(async ({ data, context }) => {
    const { hashPhone } = await import("@/integrations/phone/hash.server");
    const { userId, claims, supabase } = context as {
      userId: string;
      claims: { phone?: string };
      supabase: any;
    };
    const myPhone = claims?.phone ? `+${String(claims.phone).replace(/\D/g, "")}` : "";
    if (!myPhone) {
      return { applied: false, reason: "no-phone" };
    }
    const myHash = hashPhone(myPhone);
    if (myHash === data.inviterHash) {
      // Don't let people invite themselves.
      return { applied: false, reason: "self" };
    }

    // Insert: I (the new user) added the inviter. One-sided.
    const { error } = await supabase.from("adds").upsert(
      [{
        adder_id: userId,
        adder_phone_hash: myHash,
        added_phone_hash: data.inviterHash,
      }],
      { onConflict: "adder_id,added_phone_hash", ignoreDuplicates: true },
    );
    if (error) {
      console.error("consumeInvite insert error", error);
      throw new Error(error.message);
    }
    return { applied: true };
  });
