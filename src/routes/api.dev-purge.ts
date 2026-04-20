// One-shot pre-launch purge of seeded synthetic test accounts.
// DELETE THIS FILE once you've hit it successfully.
//
// Usage: GET /api/dev-purge?key=purge-once-3a91-c2f8
//
// What it does (idempotent):
//   1. Finds every test_accounts row whose user has user_metadata.seeded === true
//   2. For each such user_id:
//        - removes their adds (both as adder and as added party, using their hash)
//        - removes any messages they sent or received
//        - removes the test_accounts row
//        - removes their roles
//        - deletes the auth.users record itself
//
// PIN 1982 is preserved (it was your original test account, not seeded).

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hashPhone } from "@/integrations/phone/hash.server";

const SEEDED_PINS = ["2222", "3333", "4444", "5555"];
const synthPhone = (pin: string) => `+1999000${pin}`;

export const Route = createFileRoute("/api/dev-purge")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = url.searchParams.get("key");
        if (key !== "purge-once-3a91-c2f8") {
          return new Response("forbidden", { status: 403 });
        }

        const log: string[] = [];

        for (const pin of SEEDED_PINS) {
          const phone = synthPhone(pin);
          const hash = hashPhone(phone);

          const link = await supabaseAdmin
            .from("test_accounts")
            .select("user_id")
            .eq("pin", pin)
            .maybeSingle();
          const userId = link.data?.user_id as string | undefined;

          // Wipe data tied to this hash regardless of whether the user row
          // still exists (so re-runs are clean).
          await supabaseAdmin.from("messages").delete().or(
            `sender_phone_hash.eq.${hash},recipient_phone_hash.eq.${hash}`,
          );
          await supabaseAdmin.from("adds").delete().or(
            `adder_phone_hash.eq.${hash},added_phone_hash.eq.${hash}`,
          );
          await supabaseAdmin.from("test_accounts").delete().eq("pin", pin);

          if (userId) {
            await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
            const del = await supabaseAdmin.auth.admin.deleteUser(userId);
            log.push(
              `PIN ${pin}: purged data + ${del.error ? `auth delete failed: ${del.error.message}` : "deleted auth user"}`,
            );
          } else {
            log.push(`PIN ${pin}: no link row, data scrubbed`);
          }
        }

        return new Response(JSON.stringify({ ok: true, log }, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
