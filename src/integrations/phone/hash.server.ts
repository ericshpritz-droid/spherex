// Server-only phone hashing.
//
// Computes sha256(pepper + ":" + e164) and returns the hex digest.
// The pepper lives in the PHONE_PEPPER runtime secret and is NEVER bundled
// into client code. Importing this file from anywhere reachable by the client
// bundle will fail the build (the `.server.ts` suffix is import-protected).

import crypto from "node:crypto";

function getPepper(): string {
  const pepper = process.env.PHONE_PEPPER;
  if (!pepper || pepper.length < 16) {
    throw new Error(
      "PHONE_PEPPER is not configured (or too short). Set it as a runtime secret."
    );
  }
  return pepper;
}

/** Hash a single E.164 phone number (string starting with '+'). */
export function hashPhone(e164: string): string {
  const normalized = String(e164 ?? "").trim();
  if (!normalized.startsWith("+") || normalized.length < 8) {
    throw new Error("hashPhone requires an E.164 number (e.g. +15551234567)");
  }
  return crypto
    .createHash("sha256")
    .update(`${getPepper()}:${normalized}`)
    .digest("hex");
}

export function hashPhones(e164s: string[]): string[] {
  return e164s.map(hashPhone);
}
