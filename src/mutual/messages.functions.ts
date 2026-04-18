// Emoji-only messages between mutually-matched users.
// All identity is phone-hash-based (same model as `adds`); we never expose
// raw phone numbers to the client.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Mirror the DB validation client-side so we fail fast with a friendly error
// instead of round-tripping for obvious garbage. The DB trigger is the source
// of truth.
const EMOJI_ONLY_RE =
  /^(?:[\p{Extended_Pictographic}\p{Emoji_Component}\p{Regional_Indicator}\u200D\uFE0F\u20E3])+$/u;

function validateBody(body: string) {
  if (typeof body !== "string" || body.length === 0) {
    throw new Error("Message can't be empty");
  }
  if ([...body].length > 8 || body.length > 32) {
    throw new Error("Message must be 8 emoji or fewer");
  }
  if (!EMOJI_ONLY_RE.test(body)) {
    throw new Error("Emoji only — no letters or numbers");
  }
}

function validHash(h: string) {
  return typeof h === "string" && /^[a-f0-9]{64}$/.test(h);
}

/** Send a single emoji-only message to a matched user (by their phone hash). */
export const sendMessageServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { otherPhoneHash: string; body: string }) => {
    if (!validHash(input.otherPhoneHash)) throw new Error("Invalid recipient");
    validateBody(input.body);
    return input;
  })
  .handler(async ({ data, context }) => {
    const { hashPhone } = await import("@/integrations/phone/hash.server");
    const { supabase, userId, claims } = context as {
      supabase: any;
      userId: string;
      claims: { phone?: string };
    };
    const myPhone = claims?.phone ? `+${String(claims.phone).replace(/\D/g, "")}` : "";
    if (!myPhone) throw new Error("Your account is missing a verified phone number.");
    const myHash = hashPhone(myPhone);

    const { data: row, error } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        sender_phone_hash: myHash,
        recipient_phone_hash: data.otherPhoneHash,
        body: data.body,
      })
      .select("id, sender_phone_hash, recipient_phone_hash, body, created_at")
      .single();

    if (error) {
      // Bubble the DB trigger / RLS message up cleanly
      throw new Error(error.message || "Could not send message");
    }
    return { message: row };
  });

/** Load the most recent ~100 messages between me and another matched user. */
export const loadThreadServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { otherPhoneHash: string }) => {
    if (!validHash(input.otherPhoneHash)) throw new Error("Invalid recipient");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { hashPhone } = await import("@/integrations/phone/hash.server");
    const { supabase, claims } = context as {
      supabase: any;
      claims: { phone?: string };
    };
    const myPhone = claims?.phone ? `+${String(claims.phone).replace(/\D/g, "")}` : "";
    if (!myPhone) return { messages: [], myHash: "" };
    const myHash = hashPhone(myPhone);

    // RLS already restricts to messages I sent or received, but we narrow to
    // just the conversation with `otherPhoneHash` here.
    const other = data.otherPhoneHash;
    const { data: rows, error } = await supabase
      .from("messages")
      .select("id, sender_phone_hash, recipient_phone_hash, body, created_at")
      .or(
        `and(sender_phone_hash.eq.${myHash},recipient_phone_hash.eq.${other}),and(sender_phone_hash.eq.${other},recipient_phone_hash.eq.${myHash})`,
      )
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    return { messages: rows ?? [], myHash };
  });

/** Unsend a message you sent within the last 60 seconds. RLS enforces both. */
export const unsendMessageServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (typeof input.id !== "string" || input.id.length < 10) {
      throw new Error("Invalid message id");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context as { supabase: any };
    const { error, count } = await supabase
      .from("messages")
      .delete({ count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (!count) {
      // Either not yours or older than 60s — RLS filtered the row out.
      throw new Error("Too late to unsend this message");
    }
    return { unsent: true };
  });
