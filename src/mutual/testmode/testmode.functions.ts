import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isValidTestCode, isValidTestPin, synthEmail, synthPhone } from "./shared";

async function ensureTestModeEnabled() {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("test_mode")
    .eq("id", 1)
    .single();
  if (error) throw new Error("Could not read app settings");
  if (!data?.test_mode) throw new Error("Test mode is disabled");
}

export const testmodePinStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { pin: string }) => {
    if (!isValidTestPin(input.pin)) throw new Error("PIN must be 4 digits");
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

export const testmodeResolvePin = createServerFn({ method: "POST" })
  .inputValidator((input: { pin: string }) => {
    if (!isValidTestPin(input.pin)) throw new Error("PIN must be 4 digits");
    return input;
  })
  .handler(async ({ data }) => {
    await ensureTestModeEnabled();
    const { data: row } = await supabaseAdmin
      .from("test_accounts")
      .select("pin")
      .eq("pin", data.pin)
      .maybeSingle();
    if (!row) throw new Error("No test account with that PIN yet");
    return { e164: synthPhone(data.pin) };
  });

export const testmodeLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { pin: string; code: string }) => {
    if (!isValidTestPin(input.pin)) throw new Error("PIN must be 4 digits");
    if (!isValidTestCode(input.code)) throw new Error("Code must be 6 digits");
    return input;
  })
  .handler(async ({ data }) => {
    await ensureTestModeEnabled();
    const email = synthEmail(data.pin);
    const phone = synthPhone(data.pin);

    const { data: existing } = await supabaseAdmin
      .from("test_accounts")
      .select("user_id")
      .eq("pin", data.pin)
      .maybeSingle();

    if (!existing) {
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
        await supabaseAdmin.auth.admin.deleteUser(created.user.id);
        throw new Error("Could not register PIN");
      }
    }

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

export const testmodeListPhones = createServerFn({ method: "POST" })
  .handler(async () => {
    await ensureTestModeEnabled();
    const { data, error } = await supabaseAdmin
      .from("test_accounts")
      .select("pin");
    if (error) throw new Error("Could not list test accounts");
    return { phones: (data || []).map((r) => synthPhone(r.pin as string)) };
  });
