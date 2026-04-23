import { readFileSync } from "node:fs";

const checks = [
  {
    path: "src/routes/_app.phone.tsx",
    forbidden: ["pendingOtpDelivery", "deliveryMode", "deliveryStatus"],
  },
  {
    path: "src/routes/_app.code.tsx",
    forbidden: ["pendingOtpDelivery", "deliveryMode=", "deliveryStatus="],
  },
  {
    path: "src/mutual/AppContext.tsx",
    forbidden: ["pendingOtpDelivery"],
  },
  {
    path: "src/mutual/screens/Onboarding.jsx",
    forbidden: [
      "export function ScreenPhone({ accent, onSendCode, onBack, deliveryMode",
      "export function ScreenPhone({ accent, onSendCode, onBack, deliveryStatus",
      "<ScreenPhone\n      accent={accent}\n      deliveryMode=",
      "<ScreenPhone\n      accent={accent}\n      deliveryStatus=",
    ],
  },
];

const violations = [];

for (const check of checks) {
  const contents = readFileSync(new URL(`../${check.path}`, import.meta.url), "utf8");
  for (const token of check.forbidden) {
    if (contents.includes(token)) {
      violations.push(`${check.path}: found forbidden token \"${token}\"`);
    }
  }
}

if (violations.length > 0) {
  console.error("Phone flow delivery-status guard failed:\n" + violations.join("\n"));
  process.exit(1);
}

console.log("Phone flow delivery-status guard passed.");