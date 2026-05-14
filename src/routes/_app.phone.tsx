import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, PhoneField, Eyebrow } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
import { useTestMode } from "@/mutual/testmode/useTestMode";
import { toast } from "@/mutual/toast";

export const Route = createFileRoute("/_app/phone")({
  head: () => ({
    meta: [
      { title: "Verify your number — sphere" },
      { name: "description", content: "Enter your phone number. We'll text you a 6-digit code. Hashed on device." },
    ],
  }),
  component: PhoneRoute,
});

function PhoneRoute() {
  const { startOtp } = useApp();
  const { enabled: testModeEnabled } = useTestMode();
  const navigate = useNavigate();
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = digits.length === 10;

  async function send() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await startOtp(digits);
      navigate({ to: "/code" });
    } catch (e: any) {
      toast(e?.message || "Could not send code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SphereScreen>
      {/* Top bar — back arrow · STEP 1 OF 3 · spacer */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          aria-label="Back"
          onClick={() => navigate({ to: "/welcome" })}
          className="font-sans text-[18px] text-ink/80 -ml-1 px-2"
        >
          ←
        </button>
        <div
          className="font-mono text-[11px] uppercase text-mute"
          style={{ letterSpacing: "0.22em" }}
        >
          Step 1 of 3
        </div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4" data-scroll>
        <Eyebrow>Verify your number</Eyebrow>
        <h1 className="mt-3 font-serif italic text-[40px] leading-[1.02] tracking-tight">
          What's your number?
        </h1>
        <p className="mt-3 text-[15px] text-mute leading-snug">
          We'll text you a 6-digit code. Nothing else.
        </p>

        <div className="mt-7">
          <PhoneField value={digits} onChange={setDigits} autoFocus />
          <p className="mt-3 text-[13px] text-mute leading-snug">
            Hashed on this device. Used only to find your matches — never shared.
          </p>
          {testModeEnabled && (
            <div
              className="mt-4 rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-mono text-mute"
              style={{ letterSpacing: "0.04em" }}
            >
              <span className="text-ink font-semibold">TEST MODE</span> · No SMS will be sent. Use any 10-digit number; the next-screen code is <span className="text-ink font-semibold">111111</span>.
            </div>
          )}
        </div>
      </div>

      <div
        className="px-6 pt-4"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 2rem + var(--kb-inset, 0px))` }}
      >
        <PrimaryButton onClick={send} disabled={!valid || busy}>
          {busy ? "Sending…" : "Send code"}
        </PrimaryButton>
        <div className="mt-4 text-center text-[12px] text-mute">
          We'll text a 6-digit code to confirm.
        </div>
        <div
          className="mt-3 text-center font-mono text-[10px] uppercase text-mute"
          style={{ letterSpacing: "0.22em" }}
        >
          · Hashed on device ·
        </div>
      </div>
    </SphereScreen>
  );
}
