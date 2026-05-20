import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, Eyebrow } from "@/sphere/ui";
import { Spinner } from "@/mutual/components/Spinner.jsx";
import { useTestMode } from "@/mutual/testmode/useTestMode";
import { testmodeAutoReciprocateLatest } from "@/mutual/testmode/testmode.functions";
import { useApp } from "@/mutual/AppContext";

export const Route = createFileRoute("/_app/add/patience")({
  head: () => ({
    meta: [
      { title: "Now we wait — sphere" },
      { name: "description", content: "What happens next, and what doesn't." },
    ],
  }),
  component: PatienceRoute,
});

const POINTS = [
  {
    n: "01",
    title: "Your pick stays sealed.",
    body: "Nothing is sent to them. They never know it was you.",
  },

  {
    n: "02",
    title: "We'll notify you — no need to check every day.",
    body: "Most days, nothing happens. Don't refresh. Let it sit. The rarity is the point.",
  },
  {
    n: "03",
    title: "Low risk, all the way.",
    body: "If nothing happens, nothing happens. You never showed up in their app.",
  },
];

function PatienceRoute() {
  const navigate = useNavigate();
  const { enabled: testMode } = useTestMode();
  const { refresh } = useApp();
  const autoReciprocate = useServerFn(testmodeAutoReciprocateLatest);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAutoReciprocate = async () => {
    if (status === "loading") return;
    setStatus("loading");
    setErrorMsg("");
    const toastId = toast.loading("Reciprocating…");
    try {
      const res = await autoReciprocate({ data: undefined as any });
      await refresh?.();
      setStatus("success");
      toast.success(
        res?.alreadyMatched ? "Already matched" : "Matched!",
        { id: toastId, description: "Heading to your sphere…" },
      );
      setTimeout(() => navigate({ to: "/home", replace: true }), 700);
    } catch (e: any) {
      const msg = e?.message || "Could not reciprocate";
      setErrorMsg(msg);
      setStatus("error");
      toast.error("Auto-reciprocate failed", { id: toastId, description: msg });
    }
  };

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <div className="w-6" />
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4" data-scroll>
        <Eyebrow>Now we wait</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[36px] leading-[1.04] tracking-tight">
          What happens next.
        </h1>

        <div className="mt-8 space-y-6">
          {POINTS.map((p) => (
            <div key={p.n} className="flex gap-4">
              <div className="font-mono text-[12px] text-mute pt-1"
                style={{ letterSpacing: "0.22em" }}
              >
                {p.n}
              </div>
              <div className="flex-1">
                <div className="font-serif italic text-[22px] leading-tight">{p.title}</div>
                <div className="mt-1 text-[13px] text-mute leading-snug">{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3">
        <PrimaryButton onClick={() => navigate({ to: "/home", replace: true })}>
          I'm in — take me to my sphere
        </PrimaryButton>
        {testMode && (
          <div>
            <button
              onClick={handleAutoReciprocate}
              disabled={status === "loading" || status === "success"}
              aria-busy={status === "loading"}
              className="w-full rounded-[14px] border border-dashed border-hairline-12 bg-glass-06 text-white text-[13px] font-mono disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              style={{
                padding: "10px 14px",
                letterSpacing: "0.04em",
                borderColor: status === "error" ? "rgba(255,90,90,0.5)" : undefined,
              }}
            >
              {status === "loading" && <Spinner size={14} />}
              {status === "loading"
                ? "Reciprocating…"
                : status === "success"
                ? "✓ Matched"
                : status === "error"
                ? "↻ Retry auto-reciprocate"
                : "⚙︎ Auto-reciprocate (test mode)"}
            </button>
            {status === "error" && errorMsg && (
              <div className="mt-2 text-center text-[12px]" style={{ color: "rgba(255,140,140,0.9)" }}>
                {errorMsg} — tap retry.
              </div>
            )}
          </div>
        )}
      </div>
    </SphereScreen>
  );
}
