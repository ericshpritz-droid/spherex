import { createServerFn } from "@tanstack/react-start";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
const TWILIO_TEST_FROM = "+15005550006";
const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const phoneSchema = z.object({
  phoneE164: z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter a valid phone number."),
});

const verifySchema = z.object({
  phoneE164: z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter a valid phone number."),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits."),
});

function hashCode(phoneE164: string, code: string) {
  return createHash("sha256").update(`${phoneE164}:${code}`).digest("hex");
}

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function isTwilioTestNumber(phoneE164: string) {
  return /^\+1500555\d{4}$/.test(phoneE164);
}

async function sendVerificationSms(phoneE164: string, code: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
  if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY is not configured");

  const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: phoneE164,
      From: TWILIO_TEST_FROM,
      Body: `Sphere code: ${code}`,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Twilio SMS failed [${response.status}]: ${JSON.stringify(payload)}`);
  }
}

export const startPhoneVerification = createServerFn({ method: "POST" })
  .inputValidator((input: { phoneE164: string }) => phoneSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.phoneE164 === TWILIO_TEST_FROM) {
      throw new Error("+1 500 555 0006 is reserved as the Twilio test sender number. Use any other valid number for testing.");
    }
    if (!isTwilioTestNumber(data.phoneE164)) {
      throw new Error("With Twilio test credentials, use a Twilio test number like +15005550009 for an expected failure, or any other valid number except +15005550006.");
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();
    const codeHash = hashCode(data.phoneE164, code);

    await sendVerificationSms(data.phoneE164, code);

    const { error } = await supabaseAdmin
      .from("phone_verification_challenges")
      .upsert({
        phone_e164: data.phoneE164,
        code_hash: codeHash,
        expires_at: expiresAt,
        attempt_count: 0,
        last_sent_at: new Date().toISOString(),
        consumed_at: null,
      }, { onConflict: "phone_e164" });

    if (error) throw new Error("Could not store verification challenge.");
    return { ok: true, preview_code: code };
  });

export const verifyPhoneCode = createServerFn({ method: "POST" })
  .inputValidator((input: { phoneE164: string; code: string }) => verifySchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: challenge, error } = await supabaseAdmin
      .from("phone_verification_challenges")
      .select("phone_e164, code_hash, expires_at, attempt_count, consumed_at")
      .eq("phone_e164", data.phoneE164)
      .maybeSingle();

    if (error || !challenge) throw new Error("No active verification request for that number.");
    if (challenge.consumed_at) throw new Error("This code has already been used. Request a new one.");
    if (new Date(challenge.expires_at).getTime() < Date.now()) throw new Error("This code has expired. Request a new one.");
    if ((challenge.attempt_count ?? 0) >= MAX_ATTEMPTS) throw new Error("Too many attempts. Request a new code.");

    const incomingHash = hashCode(data.phoneE164, data.code);
    if (incomingHash !== challenge.code_hash) {
      await supabaseAdmin
        .from("phone_verification_challenges")
        .update({ attempt_count: (challenge.attempt_count ?? 0) + 1 })
        .eq("phone_e164", data.phoneE164);
      throw new Error("Invalid code.");
    }

    const { data: existingIdentity } = await supabaseAdmin
      .from("phone_auth_identities")
      .select("user_id")
      .eq("phone_e164", data.phoneE164)
      .maybeSingle();

    let userId = existingIdentity?.user_id;
    if (!userId) {
      const email = `phone-${data.phoneE164.replace(/\D/g, "")}@sphere.test`;
      const password = randomUUID() + randomUUID();
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        phone: data.phoneE164,
        phone_confirm: true,
        user_metadata: { synthetic_sms_test: true },
      });
      if (createErr || !created.user) {
        throw new Error(createErr?.message || "Could not create account for this phone number.");
      }
      userId = created.user.id;
      const { error: identityErr } = await supabaseAdmin.from("phone_auth_identities").insert({
        user_id: userId,
        phone_e164: data.phoneE164,
      });
      if (identityErr) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw new Error("Could not store phone identity.");
      }
    }

    const { error: consumeErr } = await supabaseAdmin
      .from("phone_verification_challenges")
      .update({ consumed_at: new Date().toISOString() })
      .eq("phone_e164", data.phoneE164);
    if (consumeErr) throw new Error("Could not finalize verification.");

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: `phone-${data.phoneE164.replace(/\D/g, "")}@sphere.test`,
    });
    if (linkErr || !linkData.properties?.hashed_token) {
      throw new Error(linkErr?.message || "Could not create sign-in link.");
    }

    const { data: sessionData, error: sessionErr } = await supabaseAdmin.auth.verifyOtp({
      email: `phone-${data.phoneE164.replace(/\D/g, "")}@sphere.test`,
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });
    if (sessionErr || !sessionData.session) {
      throw new Error(sessionErr?.message || "Could not start session.");
    }

    return {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    };
  });