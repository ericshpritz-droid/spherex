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

// ----- One-time share codes -----
// A signed-in tester generates a short code, sends it to a friend.
// The friend (also signed in via test mode) redeems it and the two accounts
// are mutually added — no manual contact picking needed.

const SHARE_CODE_TTL_MIN = 30;
const SHARE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function generateShareCode(): string {
  let out = "";
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 6; i++) {
    out += SHARE_CODE_ALPHABET[buf[i] % SHARE_CODE_ALPHABET.length];
  }
  return out;
}

async function getCallerPhoneHash(claims: { phone?: string }): Promise<string> {
  const raw = claims?.phone ? `+${String(claims.phone).replace(/\D/g, "")}` : "";
  if (!raw || raw.length < 8) {
    throw new Error("Your account is missing a verified phone number.");
  }
  const { hashPhone } = await import("@/integrations/phone/hash.server");
  return hashPhone(raw);
}

export const testmodeIssueShareCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureTestModeEnabled();
    const ctx = context as { userId: string; claims: { phone?: string } };
    const ownerHash = await getCallerPhoneHash(ctx.claims);

    // Invalidate any prior unconsumed codes from this user.
    await supabaseAdmin
      .from("test_share_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("owner_user_id", ctx.userId)
      .is("consumed_at", null);

    // Try a few times in the (vanishingly unlikely) collision case.
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateShareCode();
      const expiresAt = new Date(Date.now() + SHARE_CODE_TTL_MIN * 60_000).toISOString();
      const { error } = await supabaseAdmin
        .from("test_share_codes")
        .insert({
          code,
          owner_user_id: ctx.userId,
          owner_phone_hash: ownerHash,
          expires_at: expiresAt,
        });
      if (!error) {
        return { code, expiresAt, ttlMinutes: SHARE_CODE_TTL_MIN };
      }
      lastErr = error;
    }
    throw new Error((lastErr as any)?.message || "Could not issue share code");
  });

export const testmodeRedeemShareCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => {
    const code = String(input?.code ?? "").toUpperCase().trim();
    if (!/^[A-Z0-9]{6}$/.test(code)) throw new Error("Code must be 6 characters");
    return { code };
  })
  .handler(async ({ data, context }) => {
    await ensureTestModeEnabled();
    const ctx = context as { userId: string; claims: { phone?: string } };
    const myHash = await getCallerPhoneHash(ctx.claims);

    const { data: row, error: lookupErr } = await supabaseAdmin
      .from("test_share_codes")
      .select("code, owner_user_id, owner_phone_hash, expires_at, consumed_at")
      .eq("code", data.code)
      .maybeSingle();

    if (lookupErr) throw new Error("Could not look up code");
    if (!row) throw new Error("That code doesn't exist");
    if (row.consumed_at) throw new Error("That code was already used");
    if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("That code has expired");
    if (row.owner_user_id === ctx.userId) throw new Error("You can't redeem your own code");

    // Mutual add — insert both directions, ignoring duplicates.
    const rows = [
      {
        adder_id: ctx.userId,
        adder_phone_hash: myHash,
        added_phone_hash: row.owner_phone_hash,
      },
      {
        adder_id: row.owner_user_id,
        adder_phone_hash: row.owner_phone_hash,
        added_phone_hash: myHash,
      },
    ];
    for (const r of rows) {
      const { error: insErr } = await supabaseAdmin.from("adds").insert(r);
      // Ignore unique-violation style "already added" errors so the redeem
      // is idempotent and a previously-added pair still "matches".
      if (insErr && !/duplicate|unique|already/i.test(insErr.message || "")) {
        throw new Error(insErr.message || "Could not record match");
      }
    }

    await supabaseAdmin
      .from("test_share_codes")
      .update({ consumed_at: new Date().toISOString(), consumed_by_user_id: ctx.userId })
      .eq("code", data.code);

    return { matched: true };
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

// Auto-reciprocate the caller's most recent add. TEST MODE ONLY.
// Finds the test_account whose synthetic phone hashes to my latest add's
// added_phone_hash, and inserts the reverse `adds` row as that user — instantly
// producing a mutual match without needing a second browser. Remove this fn
// (and its UI button) when test mode is retired.
export const testmodeAutoReciprocateLatest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Hard guard: refuse outright on any non-test deployment, regardless of
    // the app_settings.test_mode flag. AUTORECIPROCATE_ALLOWED must be
    // explicitly set to "1" in the runtime env for this fn to do anything.
    if (process.env.AUTORECIPROCATE_ALLOWED !== "1") {
      throw new Error("Auto-reciprocate is disabled in this environment");
    }
    await ensureTestModeEnabled();
    const ctx = context as { userId: string; claims: { phone?: string } };

    // Second guard: the caller must themselves be a synthetic test account.
    const { data: callerTest, error: callerErr } = await supabaseAdmin
      .from("test_accounts")
      .select("user_id")
      .eq("user_id", ctx.userId)
      .maybeSingle();
    if (callerErr) throw new Error("Could not verify test account");
    if (!callerTest) throw new Error("Auto-reciprocate is only for test PIN accounts");

    const myHash = await getCallerPhoneHash(ctx.claims);

    const { data: latest, error: latestErr } = await supabaseAdmin
      .from("adds")
      .select("added_phone_hash")
      .eq("adder_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestErr) throw new Error("Could not read your latest add");
    if (!latest) throw new Error("No recent add to reciprocate");

    const { hashPhone } = await import("@/integrations/phone/hash.server");
    const { data: testers, error: tErr } = await supabaseAdmin
      .from("test_accounts")
      .select("pin, user_id");
    if (tErr) throw new Error("Could not list test accounts");

    const match = (testers || []).find(
      (t) => hashPhone(synthPhone(t.pin as string)) === latest.added_phone_hash
    );
    if (!match) throw new Error("Reverse-add only works for test PIN accounts");

    const { error: insErr } = await supabaseAdmin.from("adds").insert({
      adder_id: match.user_id,
      adder_phone_hash: latest.added_phone_hash,
      added_phone_hash: myHash,
      intent: "romantic",
    });
    if (insErr && !/duplicate|unique|already/i.test(insErr.message || "")) {
      throw new Error(insErr.message || "Could not insert reverse add");
    }
    return { matched: true };
  });
