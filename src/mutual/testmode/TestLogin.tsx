import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { applySessionTokens } from "../auth";
import { testmodeListDemoTesters, testmodeLogin } from "./testmode.functions";
import { isValidTestCode, isValidTestPin } from "./shared";

type Props = { onCancel: () => void };

type DemoTester = { pin: string; display_name: string };

export function TestLogin({ onCancel }: Props) {
  const [step, setStep] = useState<"pick" | "code">("pick");
  const [pin, setPin] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [testers, setTesters] = useState<DemoTester[]>([]);
  const [demoCode, setDemoCode] = useState<string>("");
  const [loadingTesters, setLoadingTesters] = useState(true);

  const loginWithTestMode = useServerFn(testmodeLogin);
  const listDemo = useServerFn(testmodeListDemoTesters);

  useEffect(() => {
    let cancelled = false;
    listDemo({ data: undefined as any })
      .then((r: any) => {
        if (cancelled) return;
        setTesters(r?.testers || []);
        setDemoCode(r?.code || "");
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingTesters(false); });
    return () => { cancelled = true; };
  }, [listDemo]);

  const signIn = async (pinValue: string, codeValue: string) => {
    setBusy(true); setErr("");
    try {
      const session = await loginWithTestMode({ data: { pin: pinValue, code: codeValue } });
      await applySessionTokens(session.access_token, session.refresh_token);
    } catch (e: any) {
      setErr(e?.message || "Sign-in failed");
      setBusy(false);
    }
  };

  const signInAsDemo = (tester: DemoTester) => {
    setPin(tester.pin);
    void signIn(tester.pin, demoCode || "111111");
  };

  const signInAsRandom = () => {
    if (testers.length === 0) return;
    const pick = testers[Math.floor(Math.random() * testers.length)];
    signInAsDemo(pick);
  };

  const submitManualPin = () => {
    setErr("");
    if (!isValidTestPin(pin)) { setErr("PIN must be 4 digits"); return; }
    setStep("code");
  };

  const submitManualCode = () => {
    setErr("");
    if (!isValidTestCode(code)) { setErr("Code must be 6 digits"); return; }
    void signIn(pin, code);
  };

  return (
    <div className="h-full flex flex-col bg-ink text-white overflow-y-auto" style={{ padding: "72px 28px 32px" }}>
      <button
        onClick={onCancel}
        className="w-11 h-11 rounded-full border-0 bg-glass-08 text-white text-xl cursor-pointer mb-6 self-start"
        aria-label="Back"
      >←</button>
      <div className="font-bold tracking-sora-display" style={{ fontSize: 30, lineHeight: 1.05 }}>
        Test mode
      </div>
      <div className="mt-2 text-[14px] text-fg-60">
        Skip SMS. Sign in as a demo tester or use your own 4-digit PIN.
      </div>

      {step === "pick" && (
        <>
          <div className="mt-7">
            <div className="text-[12px] uppercase tracking-wider text-fg-45 mb-3">Demo testers</div>
            {loadingTesters && <div className="text-[13px] text-fg-60">Loading…</div>}
            {!loadingTesters && testers.length === 0 && (
              <div className="rounded-[14px] bg-glass-06 border border-hairline-12 text-[13px] text-fg-60" style={{ padding: 14 }}>
                No demo testers seeded yet. An admin can seed them from the Admin screen, or use a manual PIN below.
              </div>
            )}
            {testers.length > 0 && (
              <div className="flex flex-col gap-2">
                {testers.map((t) => (
                  <button
                    key={t.pin}
                    onClick={() => signInAsDemo(t)}
                    disabled={busy}
                    className="flex items-center justify-between rounded-[14px] bg-glass-06 border border-hairline-12 text-white disabled:opacity-40 cursor-pointer"
                    style={{ padding: "14px 16px" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-bold"
                        style={{ background: "rgba(255,255,255,0.10)" }}
                      >
                        {t.display_name?.[0] ?? "?"}
                      </div>
                      <div className="text-left">
                        <div className="text-[15px] font-semibold leading-none">{t.display_name}</div>
                        <div className="text-[12px] text-fg-55 mt-1">PIN {t.pin}</div>
                      </div>
                    </div>
                    <div className="text-[13px] text-fg-60">Sign in →</div>
                  </button>
                ))}
                <button
                  onClick={signInAsRandom}
                  disabled={busy}
                  className="mt-1 rounded-[14px] bg-white text-black font-semibold disabled:opacity-40"
                  style={{ padding: "14px 20px", border: 0, cursor: "pointer" }}
                >
                  {busy ? "Signing in…" : "🎲 Sign in as a random tester"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="text-[12px] uppercase tracking-wider text-fg-45 mb-3">Or use your own PIN</div>
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1982"
                className="flex-1 rounded-[14px] bg-glass-06 border border-hairline-12 text-white text-2xl font-semibold tracking-widest text-center"
                style={{ padding: "14px 16px", letterSpacing: 8 }}
              />
              <button
                onClick={submitManualPin}
                disabled={busy || pin.length !== 4}
                className="rounded-[14px] bg-glass-12 text-white font-semibold disabled:opacity-40"
                style={{ padding: "0 18px", border: 0, cursor: "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        </>
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
            onClick={submitManualCode}
            disabled={busy || code.length !== 6}
            className="mt-3 rounded-[14px] bg-white text-black font-semibold disabled:opacity-40"
            style={{ padding: "14px 20px", border: 0, cursor: "pointer" }}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <button
            onClick={() => { setStep("pick"); setCode(""); setErr(""); }}
            className="text-[13px] text-fg-60 bg-transparent border-0 cursor-pointer mt-1"
          >
            ← Back
          </button>
        </div>
      )}

      {err && <div className="mt-4 text-[13px] text-error">{err}</div>}
    </div>
  );
}
