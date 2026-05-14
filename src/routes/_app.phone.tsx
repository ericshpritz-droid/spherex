import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, PhoneField, Eyebrow } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
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
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          aria-label="Back"
          onClick={() => navigate({ to: "/welcome" })}
          className="font-sans text-[18px] text-ink/80 -ml-1 px-2"
        >
          ←
        </button>
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-10 pb-4" data-scroll>
        <Eyebrow>Step 1 of 2</Eyebrow>
        <h1 className="mt-3 font-serif italic text-[40px] leading-[1.02] tracking-tight">
          What's your number?
        </h1>
        <p className="mt-3 text-[14px] text-mute leading-snug">
          We'll text you a 6-digit code. Your number is hashed on device — we never store the raw value.
        </p>

        <div className="mt-8">
          <PhoneField value={digits} onChange={setDigits} autoFocus />
        </div>
      </div>

      <div className="px-6 pb-8 pt-4">
        <PrimaryButton onClick={send} disabled={!valid || busy}>
          {busy ? "Sending…" : "Send code"}
        </PrimaryButton>
        <div
          className="mt-4 text-center font-mono text-[10px] uppercase text-mute"
          style={{ letterSpacing: "0.22em" }}
        >
          · Hashed on device ·
        </div>
      </div>
    </SphereScreen>
  );
}
