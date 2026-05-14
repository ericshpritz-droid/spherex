/**
 * North American Numbering Plan (NANP) phone normalization & validation.
 *
 * The app targets the United States and Canada only. Both countries share
 * the +1 country code and the same 10-digit national format:
 *
 *     NPA   NXX   XXXX
 *     ───   ───   ────
 *     area  exch  subscriber
 *
 * Rules enforced here (per ITU-T E.164 and NANPA assignment policy):
 *
 *  1. Strip all non-digit characters.
 *  2. If the result is 11 digits and starts with `1`, drop that leading
 *     country-code digit. (`1 (415) 555-2671` → `4155552671`.)
 *  3. The remaining string must be exactly 10 digits.
 *  4. Area code (NPA) — first digit MUST be 2-9. NPAs starting with 0 or 1
 *     are reserved.
 *  5. Exchange (NXX) — first digit MUST be 2-9 for the same reason.
 *  6. N11 codes (211, 311, 411, 511, 611, 711, 811, 911) are NEVER valid as
 *     either NPA or NXX — they are reserved for service access codes.
 *
 * Anything that fails these rules is rejected at the input layer so we never
 * persist garbage into `phone_e164` or hash an unverifiable string.
 *
 * Server-side helpers that read `auth.jwt() ->> 'phone'` are out of scope:
 * Supabase Auth has already validated and stored those numbers in E.164.
 */

export type NanpInvalidReason =
  | "empty"
  | "too-short"
  | "too-long"
  | "bad-area-code"
  | "bad-exchange"
  | "n11-reserved";

export interface NanpValidation {
  ok: boolean;
  digits: string; // 10-digit national number, or partial input on failure
  reason?: NanpInvalidReason;
  /** Human-friendly hint suitable for inline error UI. */
  message?: string;
}

const N11 = new Set([
  "211",
  "311",
  "411",
  "511",
  "611",
  "711",
  "811",
  "911",
]);

/**
 * Strip non-digits and the optional leading `1` country code. Always returns
 * at most 10 digits — never throws. Use this to feed controlled inputs.
 */
export function normalizeNanp(raw: string | null | undefined): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.slice(0, 10);
}

/** Validate a fully-typed 10-digit NANP number. */
export function validateNanp(raw: string | null | undefined): NanpValidation {
  const digits = normalizeNanp(raw);

  if (digits.length === 0) {
    return { ok: false, digits, reason: "empty", message: "Enter a phone number" };
  }
  if (digits.length < 10) {
    const short = 10 - digits.length;
    return {
      ok: false,
      digits,
      reason: "too-short",
      message: `${short} more digit${short === 1 ? "" : "s"}`,
    };
  }
  if (digits.length > 10) {
    // normalizeNanp caps at 10, so this only fires if a caller bypasses it.
    return { ok: false, digits, reason: "too-long", message: "Too many digits" };
  }

  const npa = digits.slice(0, 3);
  const nxx = digits.slice(3, 6);

  if (!/^[2-9]/.test(npa)) {
    return {
      ok: false,
      digits,
      reason: "bad-area-code",
      message: "Area codes can’t start with 0 or 1",
    };
  }
  if (N11.has(npa)) {
    return {
      ok: false,
      digits,
      reason: "n11-reserved",
      message: `${npa} isn’t a real area code`,
    };
  }
  if (!/^[2-9]/.test(nxx)) {
    return {
      ok: false,
      digits,
      reason: "bad-exchange",
      message: "That number doesn’t look right",
    };
  }
  if (N11.has(nxx)) {
    return {
      ok: false,
      digits,
      reason: "n11-reserved",
      message: "That number doesn’t look right",
    };
  }

  return { ok: true, digits };
}

/** True when input is a complete, valid NANP number. */
export function isValidNanp(raw: string | null | undefined): boolean {
  return validateNanp(raw).ok;
}

/** Convert a 10-digit NANP number to E.164 (`+1XXXXXXXXXX`). */
export function toE164(raw: string | null | undefined): string | null {
  const v = validateNanp(raw);
  return v.ok ? `+1${v.digits}` : null;
}

/** Pretty-print as user types: `(415) 555-2671`, `(415) 555`, `(415`. */
export function formatNanp(raw: string | null | undefined): string {
  const d = normalizeNanp(raw);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
