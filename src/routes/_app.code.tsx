import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, Eyebrow } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
import { useTestMode } from "@/mutual/testmode/useTestMode";
import { formatE164 } from "@/mutual/auth";
import { toast } from "@/mutual/toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/code")({
  head: () => ({
    meta: [
      { title: "Check your messages — sphere" },
      { name: "description", content: "Enter the 6-digit code we just texted you." },
    ],
  }),
  component: CodeRoute,
});

function CodeRoute() {
  const { pendingPhone, pendingCodeHint, pendingOtpCooldownSeconds, resendOtp, verifyCode } = useApp();
  const { enabled: testModeEnabled } = useTestMode();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(pendingOtpCooldownSeconds || 24);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (code.length === 6 && !busy) void submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await verifyCode(code);
      navigate({ to: "/instagram" as any, replace: true });
    } catch (e: any) {
      const msg = e?.message || "We couldn't verify that code. Try again.";
      setError(msg);
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
        <div
          className="font-mono text-[11px] uppercase text-mute"
          style={{ letterSpacing: "0.22em" }}
        >
          Step 2 of 3
        </div>
        <div className="w-6" />
      </div>

      <div className="px-6 pt-5 pb-2 shrink-0" data-scroll>
        <Eyebrow>Enter your code</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[28px] leading-[1.05] tracking-tight">
          Check your messages.
        </h1>
        <div className="mt-2 flex items-center gap-2 text-[13px] text-mute">
          <span>Sent to {phoneFmt || "your number"} ·</span>
          <button
            onClick={() => navigate({ to: "/phone" })}
            className="underline text-ink/70"
          >
            Edit
          </button>
        </div>

        {pendingCodeHint && (
          <div className="mt-3 rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-mono text-mute">
            <span className="text-ink font-semibold">{testModeEnabled ? "TEST MODE" : "Dev hint"}:</span> {pendingCodeHint}
            {testModeEnabled && <span className="block mt-1 normal-case text-mute">Tap to auto-fill, or just type it in.</span>}
          </div>
        )}

        {/* OTP boxes */}
        <div className="mt-5">
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
                    "flex-1 aspect-[3/4] max-w-[44px] rounded-xl",
                    "flex items-center justify-center bg-surface border",
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

          <input
            ref={inputRef}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              if (error) setError(null);
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            type="tel"
            maxLength={6}
            aria-label="6-digit verification code"
            // Keep input in normal flow but visually hidden so iOS does not
            // scroll-to-focus and yank the OTP boxes off-screen when the
            // keyboard opens.
            style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none", left: 0, top: 0 }}
          />
        </div>

        <div className="mt-4 text-center text-[13px] text-mute">
          Didn't get it?{" "}
          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className={cn(
              cooldown > 0 ? "text-mute" : "text-ink/80 underline",
            )}
          >
            Resend
          </button>
          {cooldown > 0 && (
            <span className="font-mono"> in {mm}:{ss}</span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0" />

      <div
        className="px-6 pt-3 shrink-0"
        style={{ paddingBottom: `calc(max(env(safe-area-inset-bottom), var(--kb-inset, 0px)) + 1rem)` }}
      >
        <PrimaryButton onClick={submit} disabled={code.length !== 6 || busy}>
          {busy ? "Verifying…" : "Confirm"}
        </PrimaryButton>
        <div className="mt-3 text-center text-[12px] text-mute">
          We'll text you a fresh code if anything looks off.
        </div>
      </div>
    </SphereScreen>
  );
}
