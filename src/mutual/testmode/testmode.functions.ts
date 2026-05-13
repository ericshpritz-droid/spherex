import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

async function ensureAdminAccess(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });

  if (error) throw new Error("Could not verify admin access");
  if (!data) throw new Error("Not authorized");
}

async function purgeSyntheticAccounts() {
  const { data: accounts, error } = await supabaseAdmin
    .from("test_accounts")
    .select("user_id");

  if (error) throw new Error("Could not list test accounts");
  if (!accounts?.length) return;

  for (const account of accounts) {
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(account.user_id);
    if (deleteError && !/user not found/i.test(deleteError.message || "")) {
      throw new Error("Could not deactivate test accounts");
    }
  }

  const { error: cleanupError } = await supabaseAdmin
    .from("test_accounts")
    .delete()
    .in("user_id", accounts.map((account) => account.user_id));

  if (cleanupError) throw new Error("Could not clean up test accounts");
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

// Demo testers — pre-seeded synthetic accounts that share a known passcode so
// TestFlight users can one-tap into a ready-made identity and immediately
// match with the other demo testers.
export const DEMO_TESTER_CODE = "111111";
const DEMO_TESTERS: Array<{ pin: string; display_name: string }> = [
  { pin: "1111", display_name: "Ava" },
  { pin: "2222", display_name: "Marcus" },
  { pin: "3333", display_name: "Jordan" },
  { pin: "4444", display_name: "Priya" },
];

export const testmodeListDemoTesters = createServerFn({ method: "POST" })
  .handler(async () => {
    await ensureTestModeEnabled();
    const { data, error } = await supabaseAdmin
      .from("test_accounts")
      .select("pin, display_name")
      .not("display_name", "is", null)
      .order("pin", { ascending: true });
    if (error) throw new Error("Could not list demo testers");
    return {
      code: DEMO_TESTER_CODE,
      testers: (data || []).map((r) => ({
        pin: r.pin as string,
        display_name: (r.display_name as string) || "",
      })),
    };
  });

export const testmodeSeedDemoTesters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdminAccess(context as { supabase: any; userId: string });
    await ensureTestModeEnabled();

    let created = 0;
    let updated = 0;
    for (const tester of DEMO_TESTERS) {
      const email = synthEmail(tester.pin);
      const phone = synthPhone(tester.pin);

      const { data: existing } = await supabaseAdmin
        .from("test_accounts")
        .select("user_id, display_name")
        .eq("pin", tester.pin)
        .maybeSingle();

      if (!existing) {
        const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: DEMO_TESTER_CODE,
          email_confirm: true,
          phone,
          phone_confirm: true,
          user_metadata: { test_pin: tester.pin, synthetic: true, demo: true, display_name: tester.display_name },
        });
        if (createErr || !createdUser.user) {
          throw new Error(createErr?.message || `Could not create demo tester ${tester.pin}`);
        }
        const { error: linkErr } = await supabaseAdmin
          .from("test_accounts")
          .insert({ pin: tester.pin, user_id: createdUser.user.id, display_name: tester.display_name });
        if (linkErr) {
          await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
          throw new Error(linkErr.message || "Could not register demo tester");
        }
        created += 1;
      } else if (existing.display_name !== tester.display_name) {
        const { error: updErr } = await supabaseAdmin
          .from("test_accounts")
          .update({ display_name: tester.display_name })
          .eq("pin", tester.pin);
        if (updErr) throw new Error("Could not update demo tester name");
        updated += 1;
      }
    }
    return { created, updated, total: DEMO_TESTERS.length };
  });

export const setTestMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { enabled: boolean }) => {
    if (typeof input.enabled !== "boolean") throw new Error("Invalid test mode setting");
    return input;
  })
  .handler(async ({ data, context }) => {
    await ensureAdminAccess(context as { supabase: any; userId: string });

    if (!data.enabled) {
      await purgeSyntheticAccounts();
    }

    const { error } = await supabaseAdmin
      .from("app_settings")
      .update({ test_mode: data.enabled, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) throw new Error("Could not update test mode");

    return { testMode: data.enabled };
  });
