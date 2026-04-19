export const TEST_SYNTH_DOMAIN = "sphere.test";

export function synthEmail(pin: string) {
  return `test+${pin}@${TEST_SYNTH_DOMAIN}`;
}

export function synthPhone(pin: string) {
  return `+1999000${pin}`;
}

export function isValidTestPin(pin: string) {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

export function isValidTestCode(code: string) {
  return typeof code === "string" && /^\d{6}$/.test(code);
}
