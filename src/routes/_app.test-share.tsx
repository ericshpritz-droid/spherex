import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useApp } from "../mutual/AppContext";
import { useTestMode } from "../mutual/testmode/useTestMode";
import {
  testmodeIssueShareCode,
  testmodeRedeemShareCode,
} from "../mutual/testmode/testmode.functions";
import { toast } from "../mutual/toast";
import { haptics } from "../mutual/native/haptics";

export const Route = createFileRoute("/_app/test-share")({
  head: () => ({
    meta: [
      { title: "Share test code — Sphere" },
      { name: "description", content: "One-time code to match testers in Test Mode." },
    ],
  }),
  component: TestShareRoute,
});

function TestShareRoute() {
  const navigate = useNavigate();
  const { enabled: testModeOn, loading: tmLoading } = useTestMode();
  const { refresh } = useApp();
  const issue = useServerFn(testmodeIssueShareCode);
  const redeem = useServerFn(testmodeRedeemShareCode);

  const [issuing, setIssuing] = useState(false);
  const [code, setCode] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  const [enterCode, setEnterCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const onIssue = async () => {
    setIssuing(true);
    try {
      const r = await issue({ data: undefined as any });
      setCode(r.code);
      setExpiresAt(r.expiresAt);
      haptics.success();
    } catch (e: any) {
      toast.error(e?.message || "Could not issue code");
    } finally {
      setIssuing(false);
    }
  };

  const onCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      haptics.selection();
      toast.success("Code copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const onShare = async () => {
    if (!code) return;
    const text = `Join me on Sphere — redeem code ${code} in Test Mode and we'll match instantly.`;
    const nav = navigator as any;
    if (nav?.share) {
      try { await nav.share({ title: "Sphere test code", text }); return; } catch {}
    }
    onCopy();
  };

  const onRedeem = async () => {
    setErr("");
    const c = enterCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (c.length !== 6) { setErr("Enter the 6-character code"); return; }
    setRedeeming(true);
    try {
      await redeem({ data: { code: c } });
      setSuccess(true);
      haptics.success();
      // Refresh matches so the new mutual shows up immediately.
      try { await refresh(); } catch {}
      toast.success("Matched!");
      setTimeout(() => navigate({ to: "/home" }), 700);
    } catch (e: any) {
      setErr(e?.message || "Could not redeem code");
      haptics.error?.();
    } finally {
      setRedeeming(false);
    }
  };

  if (!tmLoading && !testModeOn) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-white p-8">
        <div className="text-[15px] text-fg-60">Test Mode is off.</div>
        <button
          onClick={() => navigate({ to: "/home" })}
          className="mt-4 rounded-full bg-glass-12 text-white text-[13px]"
          style={{ padding: "10px 18px", border: 0, cursor: "pointer" }}
        >
          Back home
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-ink text-white" style={{ padding: "72px 24px 120px" }} data-scroll>
      <button
        onClick={() => navigate({ to: "/profile" })}
        className="w-11 h-11 rounded-full border-0 bg-glass-08 text-white text-xl cursor-pointer mb-6"
        aria-label="Back"
      >←</button>

      <div className="font-bold tracking-sora-display" style={{ fontSize: 28, lineHeight: 1.05 }}>
        Share test code
      </div>
      <div className="mt-2 text-[13px] text-fg-60">
        Generate a one-time code, send it to a friend testing the app. When they redeem it, you'll
        instantly become a mutual match — no contact picking required.
      </div>

      {/* Issue */}
      <section
        className="mt-6 rounded-[18px] border border-hairline-12 bg-glass-06"
        style={{ padding: 18 }}
      >
        <div className="text-[11px] uppercase tracking-widest text-fg-45">Your code</div>

        {!code && (
          <button
            onClick={onIssue}
            disabled={issuing}
            className="mt-3 w-full rounded-[14px] bg-white text-black font-semibold disabled:opacity-40"
            style={{ padding: "14px 20px", border: 0, cursor: "pointer" }}
          >
            {issuing ? "Generating…" : "Generate share code"}
          </button>
        )}

        {code && (
          <>
            <div
              className="mt-3 text-center font-bold tracking-widest"
              style={{ fontSize: 38, letterSpacing: 8 }}
            >
              {code}
            </div>
            <div className="mt-1 text-center text-[12px] text-fg-55">
              Expires {new Date(expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={onCopy}
                className="rounded-[14px] bg-glass-12 text-white font-semibold"
                style={{ padding: "12px 16px", border: 0, cursor: "pointer" }}
              >
                Copy
              </button>
              <button
                onClick={onShare}
                className="rounded-[14px] bg-white text-black font-semibold"
                style={{ padding: "12px 16px", border: 0, cursor: "pointer" }}
              >
                Share
              </button>
            </div>
            <button
              onClick={onIssue}
              disabled={issuing}
              className="mt-2 w-full text-[12px] text-fg-60 bg-transparent border-0 cursor-pointer disabled:opacity-40"
            >
              {issuing ? "Generating…" : "Generate a new code"}
            </button>
          </>
        )}
      </section>

      {/* Redeem */}
      <section
        className="mt-4 rounded-[18px] border border-hairline-12 bg-glass-06"
        style={{ padding: 18 }}
      >
        <div className="text-[11px] uppercase tracking-widest text-fg-45">Redeem a friend's code</div>
        <input
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={6}
          value={enterCode}
          onChange={(e) => setEnterCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
          placeholder="ABC123"
          className="mt-3 w-full rounded-[14px] bg-glass-08 border border-hairline-12 text-white font-bold text-center"
          style={{ padding: "14px 16px", fontSize: 26, letterSpacing: 8 }}
        />
        <button
          onClick={onRedeem}
          disabled={redeeming || success || enterCode.length !== 6}
          className="mt-3 w-full rounded-[14px] bg-white text-black font-semibold disabled:opacity-40"
          style={{ padding: "14px 20px", border: 0, cursor: "pointer" }}
        >
          {success ? "Matched ✓" : redeeming ? "Matching…" : "Redeem & match"}
        </button>
        {err && <div className="mt-3 text-[13px] text-error">{err}</div>}
      </section>
    </div>
  );
}
