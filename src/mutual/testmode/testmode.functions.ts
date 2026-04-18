// Test-mode server functions. DELETE THIS FILE TO REMOVE TEST MODE.
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SYNTH_DOMAIN = "sphere.test";
const synthEmail = (pin: string) => `test+${pin}@${SYNTH_DOMAIN}`;
const synthPhone = (pin: string) => `+1999000${pin}`; // unique-per-PIN synthetic phone

function validPin(pin: string) {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}
function validCode(code: string) {
  return typeof code === "string" && /^\d{6}$/.test(code);
}

async function ensureTestModeEnabled() {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("test_mode")
    .eq("id", 1)
    .single();
  if (error) throw new Error("Could not read app settings");
  if (!data?.test_mode) throw new Error("Test mode is disabled");
}

/**
 * Returns whether a PIN is already registered. The client uses this to decide
 * whether to show "create your 6-digit code" vs "enter your 6-digit code".
 */
export const testmodePinStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { pin: string }) => {
    if (!validPin(input.pin)) throw new Error("PIN must be 4 digits");
    return input;
  })
  .handler(async ({ data }) => {
    await ensureTestModeEnabled();
    const { data: row } = await supabaseAdmin
      .from("test_accounts")
      .select("pin")
      .eq("pin", data.pin)
      .maybeSingle();
    return { exists: !!row };
  });

/**
 * Sign up (first time) or sign in (returning) with a 4-digit PIN + 6-digit code.
 * Returns a session that the client sets via supabase.auth.setSession().
 */
export const testmodeLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { pin: string; code: string }) => {
    if (!validPin(input.pin)) throw new Error("PIN must be 4 digits");
    if (!validCode(input.code)) throw new Error("Code must be 6 digits");
    return input;
  })
  .handler(async ({ data }) => {
    await ensureTestModeEnabled();
    const email = synthEmail(data.pin);
    const phone = synthPhone(data.pin);

    // Does this PIN exist?
    const { data: existing } = await supabaseAdmin
      .from("test_accounts")
      .select("user_id")
      .eq("pin", data.pin)
      .maybeSingle();

    if (!existing) {
      // First use: create the synthetic account with this code as the password.
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.code,
        email_confirm: true,
        phone,
        phone_confirm: true,
        user_metadata: { test_pin: data.pin, synthetic: true },
      });
      if (createErr || !created.user) {
        throw new Error(createErr?.message || "Could not create test account");
      }
      const { error: linkErr } = await supabaseAdmin
        .from("test_accounts")
        .insert({ pin: data.pin, user_id: created.user.id });
      if (linkErr) {
        // Best-effort cleanup so the PIN isn't orphaned
        await supabaseAdmin.auth.admin.deleteUser(created.user.id);
        throw new Error("Could not register PIN");
      }
    }

    // Sign in (works for both freshly-created and returning accounts).
    const { data: session, error: signErr } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: data.code,
    });
    if (signErr || !session.session) {
      throw new Error("Wrong code for that PIN");
    }
    return {
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
    };
  });
