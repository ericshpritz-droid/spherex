// Server-only: ensure the DB-side phone-hash function can find the pepper.
//
// The RLS helper `public.current_user_phone_hash()` first looks at the GUC
// `app.phone_pepper`, then falls back to `public.app_secrets`. Production
// deployments may never have set the GUC out-of-band, so on the first
// server-fn call we upsert PHONE_PEPPER into the table so RLS checks pass.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

let bootstrapPromise: Promise<void> | null = null;

export function ensurePhonePepperBootstrapped(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    const pepper = process.env.PHONE_PEPPER;
    if (!pepper || pepper.length < 16) return; // hashPhone will throw instead
    try {
      await supabaseAdmin
        .from("app_secrets")
        .upsert(
          { key: "phone_pepper", value: pepper, updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
    } catch (e) {
      // Reset so a later call can retry.
      bootstrapPromise = null;
      throw e;
    }
  })();
  return bootstrapPromise;
}
