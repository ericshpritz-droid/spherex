// Server functions for the mad-lib compliments feature.
// Recipients receive ANONYMIZED rows: sender identity columns are stripped
// before returning to the client. Sender-side queries return full rows.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FRAME_IDS = ["smile", "energy", "mind", "laugh", "presence"] as const;
const ADVERBS = [
  "quietly", "unreasonably", "genuinely", "dangerously",
  "softly", "completely", "annoyingly", "honestly",
] as const;
const ADJECTIVES = [
  "magnetic", "disarming", "lovely", "rare",
  "steady", "kind", "electric", "warm", "sharp",
] as const;

function validHash(h: string) {
  return typeof h === "string" && /^[a-f0-9]{64}$/.test(h);
}

function validE164(p: string) {
  return typeof p === "string" && /^\+?\d{8,15}$/.test(p.replace(/\s+/g, ""));
}

export const sendComplimentServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      recipientPhone?: string;
      recipientPhoneHash?: string;
      frameId: string;
      adverb: string;
      adjective: string;
      body: string;
      intent?: "compliment" | "both";
    }) => {
      if (!FRAME_IDS.includes(input.frameId as any)) throw new Error("Invalid frame");
      if (!ADVERBS.includes(input.adverb as any)) throw new Error("Invalid adverb");
      if (!ADJECTIVES.includes(input.adjective as any)) throw new Error("Invalid adjective");
      if (typeof input.body !== "string" || input.body.length < 4 || input.body.length > 200) {
        throw new Error("Invalid body");
      }
      if (input.recipientPhoneHash && !validHash(input.recipientPhoneHash)) {
        throw new Error("Invalid recipient hash");
      }
      if (input.recipientPhone && !validE164(input.recipientPhone)) {
        throw new Error("Invalid recipient phone");
      }
      if (!input.recipientPhone && !input.recipientPhoneHash) {
        throw new Error("Recipient required");
      }
      if (input.intent && input.intent !== "compliment" && input.intent !== "both") {
        throw new Error("Invalid intent");
      }
      return input;
    },
  )
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

    const recipientHash = data.recipientPhoneHash
      ?? hashPhone(data.recipientPhone!.startsWith("+") ? data.recipientPhone! : `+${data.recipientPhone}`);

    const { data: row, error } = await supabase
      .from("compliments")
      .insert({
        sender_id: userId,
        sender_phone_hash: myHash,
        recipient_phone_hash: recipientHash,
        frame_id: data.frameId,
        adverb: data.adverb,
        adjective: data.adjective,
        body: data.body,
        intent: data.intent ?? "compliment",
      })
      .select("id, body, frame_id, adverb, adjective, created_at")
      .single();

    if (error) throw new Error(error.message || "Could not send compliment");
    return { compliment: row };
  });

/** Anonymous inbox: compliments addressed to me. Sender info NEVER projected. */
export const loadInboxComplimentsServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { hashPhone } = await import("@/integrations/phone/hash.server");
    const { supabase, claims } = context as {
      supabase: any;
      claims: { phone?: string };
    };
    const myPhone = claims?.phone ? `+${String(claims.phone).replace(/\D/g, "")}` : "";
    if (!myPhone) return { compliments: [] as Array<any> };
    const myHash = hashPhone(myPhone);

    const { data: rows, error } = await supabase
      .from("compliments")
      .select("id, body, frame_id, adverb, adjective, created_at")
      .eq("recipient_phone_hash", myHash)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { compliments: rows ?? [] };
  });

/** History of compliments I sent (full rows allowed for sender). */
export const loadSentComplimentsServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data: rows, error } = await supabase
      .from("compliments")
      .select("id, recipient_phone_hash, body, frame_id, adverb, adjective, intent, created_at")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { compliments: rows ?? [] };
  });

export const unsendComplimentServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (typeof input.id !== "string" || input.id.length < 10) {
      throw new Error("Invalid compliment id");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context as { supabase: any };
    const { error, count } = await supabase
      .from("compliments")
      .delete({ count: "exact" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("Too late to unsend this compliment");
    return { unsent: true };
  });
