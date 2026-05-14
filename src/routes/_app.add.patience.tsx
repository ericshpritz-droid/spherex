import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, Eyebrow } from "@/sphere/ui";
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
    title: "They get a quiet nudge.",
    body: "Anonymous text — no names, no pressure. They never know it was you.",
  },
  {
    n: "02",
    title: "Mutual is rare. That's the point.",
    body: "Most picks stay sealed. The ones that match are the ones that mean something.",
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
  const [reciprocating, setReciprocating] = useState(false);
  const [reciprocateMsg, setReciprocateMsg] = useState("");

  const handleAutoReciprocate = async () => {
    setReciprocating(true);
    setReciprocateMsg("");
    try {
      await autoReciprocate({ data: undefined as any });
      await refresh?.();
      setReciprocateMsg("Matched! Heading to your sphere…");
      setTimeout(() => navigate({ to: "/home", replace: true }), 600);
    } catch (e: any) {
      setReciprocateMsg(e?.message || "Could not reciprocate");
      setReciprocating(false);
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
              disabled={reciprocating}
              className="w-full rounded-[14px] border border-dashed border-hairline-12 bg-glass-06 text-white text-[13px] font-mono disabled:opacity-50"
              style={{ padding: "10px 14px", letterSpacing: "0.04em" }}
            >
              {reciprocating ? "Reciprocating…" : "⚙︎ Auto-reciprocate (test mode)"}
            </button>
            {reciprocateMsg && (
              <div className="mt-2 text-center text-[12px] text-mute">{reciprocateMsg}</div>
            )}
          </div>
        )}
      </div>
    </SphereScreen>
  );
}
