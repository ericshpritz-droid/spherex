// One-shot dev-only seed route.
// DELETE THIS FILE after seeding.
//
// Usage: GET /api/dev-seed?key=<PHONE_PEPPER>
//
// Creates test PINs 2222/3333/4444/5555, then wires up adds + a few emoji
// messages so PIN 1982 has 2 mutuals + 2 pending + a sample thread.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hashPhone } from "@/integrations/phone/hash.server";

const SYNTH_DOMAIN = "sphere.test";
const synthEmail = (pin: string) => `test+${pin}@${SYNTH_DOMAIN}`;
const synthPhone = (pin: string) => `+1999000${pin}`;

const TARGET_PIN = "1982";
const NEW_PINS = ["2222", "3333", "4444", "5555"];
const DEFAULT_CODE = "111111"; // 6-digit code for the new test accounts

async function ensureTestUser(pin: string): Promise<string> {
  const existing = await supabaseAdmin
    .from("test_accounts")
    .select("user_id")
    .eq("pin", pin)
    .maybeSingle();
  if (existing.data?.user_id) return existing.data.user_id as string;

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: synthEmail(pin),
    password: DEFAULT_CODE,
    email_confirm: true,
    phone: synthPhone(pin),
    phone_confirm: true,
    user_metadata: { test_pin: pin, synthetic: true, seeded: true },
  });
  if (error || !created.user) throw new Error(`createUser ${pin}: ${error?.message}`);
  const link = await supabaseAdmin
    .from("test_accounts")
    .insert({ pin, user_id: created.user.id });
  if (link.error) throw new Error(`link ${pin}: ${link.error.message}`);
  return created.user.id;
}

async function addPair(adderId: string, adderPin: string, addedPin: string) {
  const adderHash = hashPhone(synthPhone(adderPin));
  const addedHash = hashPhone(synthPhone(addedPin));
  // Idempotent: skip if this exact add already exists.
  const existing = await supabaseAdmin
    .from("adds")
    .select("id")
    .eq("adder_id", adderId)
    .eq("adder_phone_hash", adderHash)
    .eq("added_phone_hash", addedHash)
    .maybeSingle();
  if (existing.data?.id) return;
  const { error } = await supabaseAdmin.from("adds").insert({
    adder_id: adderId,
    adder_phone_hash: adderHash,
    added_phone_hash: addedHash,
  });
  if (error) throw new Error(`add ${adderPin}->${addedPin}: ${error.message}`);
}

async function sendMsg(senderId: string, senderPin: string, recipientPin: string, body: string, minutesAgo: number) {
  const senderHash = hashPhone(synthPhone(senderPin));
  const recipientHash = hashPhone(synthPhone(recipientPin));
  const created = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  const { error } = await supabaseAdmin.from("messages").insert({
    sender_id: senderId,
    sender_phone_hash: senderHash,
    recipient_phone_hash: recipientHash,
    body,
    created_at: created,
  });
  if (error) throw new Error(`msg ${senderPin}->${recipientPin}: ${error.message}`);
}

export const Route = createFileRoute("/api/dev-seed")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = url.searchParams.get("key");
        if (!key || key !== process.env.PHONE_PEPPER) {
          return new Response("forbidden", { status: 403 });
        }

        const log: string[] = [];

        // 1) Look up the existing target PIN's user_id
        const target = await supabaseAdmin
          .from("test_accounts")
          .select("user_id")
          .eq("pin", TARGET_PIN)
          .maybeSingle();
        if (!target.data?.user_id) {
          return new Response(`Target PIN ${TARGET_PIN} not found`, { status: 400 });
        }
        const targetId = target.data.user_id as string;
        log.push(`Target PIN ${TARGET_PIN} = ${targetId}`);

        // 2) Create the new test accounts
        const ids: Record<string, string> = { [TARGET_PIN]: targetId };
        for (const pin of NEW_PINS) {
          ids[pin] = await ensureTestUser(pin);
          log.push(`Ensured PIN ${pin} = ${ids[pin]}`);
        }

        // 3) Adds
        // Mutuals: 1982 <-> 2222, 1982 <-> 3333
        await addPair(ids[TARGET_PIN], TARGET_PIN, "2222");
        await addPair(ids["2222"], "2222", TARGET_PIN);
        await addPair(ids[TARGET_PIN], TARGET_PIN, "3333");
        await addPair(ids["3333"], "3333", TARGET_PIN);
        log.push("Mutuals: 1982<->2222, 1982<->3333");

        // Pending from 1982's POV: 1982 -> 4444, 1982 -> 5555 (no add back)
        await addPair(ids[TARGET_PIN], TARGET_PIN, "4444");
        await addPair(ids[TARGET_PIN], TARGET_PIN, "5555");
        log.push("Pending: 1982->4444, 1982->5555");

        // Bonus: 4444 has added someone else (3333) so 4444 has its own pending too
        await addPair(ids["4444"], "4444", "3333");
        log.push("Extra: 4444->3333");

        // 4) Sample emoji thread between 1982 and 2222
        await sendMsg(ids["2222"], "2222", TARGET_PIN, "👋", 35);
        await sendMsg(ids[TARGET_PIN], TARGET_PIN, "2222", "🙌", 33);
        await sendMsg(ids["2222"], "2222", TARGET_PIN, "🔥🔥", 10);
        await sendMsg(ids["3333"], "3333", TARGET_PIN, "👀", 4);
        log.push("Seeded emoji messages");

        return new Response(JSON.stringify({ ok: true, log }, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
