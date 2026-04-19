import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isValidTestCode, isValidTestPin, synthEmail } from "./shared";

type Props = { onCancel: () => void };

export function TestLogin({ onCancel }: Props) {
  const [step, setStep] = useState<"pin" | "code">("pin");
  const [pin, setPin] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submitPin = async () => {
    setErr("");
    if (!isValidTestPin(pin)) {
      setErr("PIN must be 4 digits");
      return;
    }
    setStep("code");
  };

  const submitCode = async () => {
    setErr("");
    if (!isValidTestCode(code)) {
      setErr("Code must be 6 digits");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: synthEmail(pin),
        password: code,
      });
      if (error) {
        if (error.message?.toLowerCase().includes("invalid login credentials")) {
          throw new Error("Wrong PIN or code. For the seeded account, try 1982 / 111111.");
        }
        throw error;
      }
    } catch (e: any) {
      setErr(e?.message || "Login failed");
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  return (
    <div className="h-full flex flex-col bg-ink text-white" style={{ padding: "72px 28px 32px" }}>
      <button
        onClick={onCancel}
        className="w-11 h-11 rounded-full border-0 bg-glass-08 text-white text-xl cursor-pointer mb-6 self-start"
      >←</button>
      <div className="font-bold tracking-sora-display" style={{ fontSize: 30, lineHeight: 1.05 }}>
        Test mode
      </div>
      <div className="mt-2 text-[14px] text-fg-60">
        Sign in with a synthetic test account using a 4-digit PIN and 6-digit code.
      </div>

      {step === "pin" && (
        <div className="mt-8 flex flex-col gap-3">
          <label className="text-[13px] text-fg-60">4-digit PIN</label>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="1982"
            className="rounded-[14px] bg-glass-06 border border-hairline-12 text-white text-2xl font-semibold tracking-widest text-center"
            style={{ padding: "16px 20px", letterSpacing: 8 }}
          />
          <button
            onClick={submitPin}
            disabled={busy || pin.length !== 4}
            className="mt-3 rounded-[14px] bg-white text-black font-semibold disabled:opacity-40"
            style={{ padding: "14px 20px", border: 0, cursor: "pointer" }}
          >
            Continue
          </button>
        </div>
      )}

      {step === "code" && (
        <div className="mt-8 flex flex-col gap-3">
          <div className="text-[13px] text-fg-60">
            PIN <span className="text-white font-semibold">{pin}</span> — enter your 6-digit passcode.
          </div>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="111111"
            className="rounded-[14px] bg-glass-06 border border-hairline-12 text-white text-2xl font-semibold tracking-widest text-center"
            style={{ padding: "16px 20px", letterSpacing: 8 }}
          />
          <button
            onClick={submitCode}
            disabled={busy || code.length !== 6}
            className="mt-3 rounded-[14px] bg-white text-black font-semibold disabled:opacity-40"
            style={{ padding: "14px 20px", border: 0, cursor: "pointer" }}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <button
            onClick={() => { setStep("pin"); setCode(""); setErr(""); }}
            className="text-[13px] text-fg-60 bg-transparent border-0 cursor-pointer mt-1"
          >
            ← Use a different PIN
          </button>
        </div>
      )}

      {err && <div className="mt-4 text-[13px] text-error">{err}</div>}
    </div>
  );
}
