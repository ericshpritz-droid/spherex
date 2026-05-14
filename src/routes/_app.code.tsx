import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, Eyebrow } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
import { formatE164 } from "@/mutual/auth";
import { toast } from "@/mutual/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/code")({
  head: () => ({
    meta: [
      { title: "Enter your code — sphere" },
      { name: "description", content: "Enter the 6-digit code we just texted you." },
    ],
  }),
  component: CodeRoute,
});

function CodeRoute() {
  const { pendingPhone, pendingCodeHint, pendingOtpCooldownSeconds, resendOtp, verifyCode } = useApp();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(pendingOtpCooldownSeconds || 24);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Auto-focus the (hidden) input so the iOS native numpad opens.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !busy) {
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function submit() {
    setBusy(true);
    try {
      await verifyCode(code);
      // Navigate explicitly to instagram. _app's redirect only fires from
      // PUBLIC_PATHS or "/", so /instagram won't be overridden.
      navigate({ to: "/instagram" as any, replace: true });
    } catch (e: any) {
      toast(e?.message || "Invalid code.");
      setCode("");
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    try {
      await resendOtp();
      setCooldown(pendingOtpCooldownSeconds || 24);
      toast("Code re-sent.");
    } catch (e: any) {
      toast(e?.message || "Could not re-send.");
    }
  }

  const phoneFmt = pendingPhone ? formatE164(pendingPhone) : "";
  const mm = String(Math.floor(cooldown / 60));
  const ss = String(cooldown % 60).padStart(2, "0");

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          aria-label="Back"
          onClick={() => navigate({ to: "/phone" })}
          className="font-sans text-[18px] text-ink/80 -ml-1 px-2"
        >
          ←
        </button>
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-10 pb-4" data-scroll>
        <Eyebrow>Step 2 of 2</Eyebrow>
        <h1 className="mt-3 font-serif italic text-[40px] leading-[1.02] tracking-tight">
          Enter your code.
        </h1>
        <div className="mt-3 flex items-center gap-2 text-[14px] text-mute">
          <span>Sent to {phoneFmt || "your number"}.</span>
          <button
            onClick={() => navigate({ to: "/phone" })}
            className="underline text-ink/70"
          >
            Edit
          </button>
        </div>

        {pendingCodeHint && (
          <div className="mt-3 rounded-xl border border-line bg-white px-3 py-2 text-[12px] font-mono text-mute">
            Dev hint: {pendingCodeHint}
          </div>
        )}

        {/* OTP boxes */}
        <div className="mt-10">
          <div
            className="flex justify-between gap-2"
            onClick={() => inputRef.current?.focus()}
          >
            {Array.from({ length: 6 }).map((_, i) => {
              const ch = code[i] || "";
              const active = i === code.length;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 aspect-[3/4] max-w-[48px] rounded-xl",
                    "flex items-center justify-center bg-white border",
                    ch ? "border-ink" : "border-line",
                    active && !ch && "border-ink/40",
                  )}
                >
                  <span className="font-serif text-[28px] text-ink">
                    {ch}
                    {active && !ch && (
                      <span className="inline-block w-px h-6 bg-ink/60 align-middle animate-[mutualBlink_1s_steps(2)_infinite]" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hidden numeric input drives state */}
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            type="tel"
            maxLength={6}
            className="absolute opacity-0 pointer-events-none"
            aria-label="6-digit verification code"
          />
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[13px]">
          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className={cn(
              "underline",
              cooldown > 0 ? "text-mute no-underline" : "text-ink/80",
            )}
          >
            Resend
          </button>
          {cooldown > 0 && (
            <span className="font-mono text-mute">{mm}:{ss}</span>
          )}
        </div>
      </div>

      <div className="px-6 pb-8 pt-4">
        <PrimaryButton
          onClick={submit}
          disabled={code.length !== 6 || busy}
        >
          {busy ? "Verifying…" : "Confirm"}
        </PrimaryButton>
      </div>
    </SphereScreen>
  );
}
