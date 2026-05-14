import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, GhostButton, Eyebrow, ComplimentBubble } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
import { toast } from "@/mutual/toast";
import { callSendCompliment } from "@/mutual/compliments.rpc";
import {
  COMPLIMENT_KEY,
  DRAFT_KEY,
  renderCompliment,
  type ComplimentDraft,
} from "@/sphere/compliments/words";

export const Route = createFileRoute("/_app/add/preview")({
  head: () => ({
    meta: [
      { title: "Send anonymously — sphere" },
      { name: "description", content: "Last look before it goes." },
    ],
  }),
  component: PreviewRoute,
});

type AddDraft = { phone: string; ig: string; intent?: "romantic" | "compliment" | "both" };

function PreviewRoute() {
  const navigate = useNavigate();
  const { addOne } = useApp();
  const [draft, setDraft] = useState<AddDraft | null>(null);
  const [compliment, setCompliment] = useState<ComplimentDraft | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const rawAdd = sessionStorage.getItem(DRAFT_KEY);
      const rawC = sessionStorage.getItem(COMPLIMENT_KEY);
      if (!rawAdd || !rawC) {
        navigate({ to: "/add/compose" as any, replace: true });
        return;
      }
      setDraft(JSON.parse(rawAdd));
      setCompliment(JSON.parse(rawC));
    } catch {
      navigate({ to: "/add/compose" as any, replace: true });
    }
  }, [navigate]);

  async function send() {
    if (!draft || !compliment || busy) return;
    setBusy(true);
    try {
      const intent = (draft.intent ?? "both") as "compliment" | "both";
      const body = renderCompliment(compliment);
      // Persist the compliment first (anonymous to recipient).
      await callSendCompliment({
        recipientPhone: draft.phone,
        frameId: compliment.frameId,
        adverb: compliment.adverb,
        adjective: compliment.adjective,
        body,
        intent,
      });
      // For "both" intent we also record the romantic add so a mutual pick is possible.
      if (intent === "both") {
        try { await addOne(draft.phone, "both"); } catch { /* non-fatal: compliment already sent */ }
      }
      try {
        sessionStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem(COMPLIMENT_KEY);
      } catch {}
      navigate({ to: "/add/patience" as any, replace: true });
    } catch (e: any) {
      toast(e?.message || "Could not send.");
      setBusy(false);
    }
  }

  if (!draft || !compliment) return <SphereScreen>{null}</SphereScreen>;

  const body = renderCompliment(compliment);

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          onClick={() => navigate({ to: "/add/compose" as any })}
          className="text-ink/80 text-[18px] -ml-1 px-2"
          aria-label="Back"
        >
          ←
        </button>
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4" data-scroll>
        <Eyebrow>Last look</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[36px] leading-[1.04] tracking-tight">
          They'll see this.
        </h1>
        <p className="mt-3 text-[14px] text-mute">
          No name. No number. No avatar. Just the words.
        </p>

        <div className="mt-7">
          <ComplimentBubble body={body} caption="From someone · anonymous" />
        </div>

        <div className="mt-8 rounded-2xl border border-[#D8D5D0] p-5">
          <div
            className="font-mono text-[10px] uppercase text-mute"
            style={{ letterSpacing: "0.22em" }}
          >
            What they won't see
          </div>
          <ul className="mt-3 space-y-2 text-[14px] text-ink/80 font-serif italic">
            <li>— Your name or phone</li>
            <li>— Your Instagram</li>
            <li>— That you've added them</li>
          </ul>
        </div>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3">
        <PrimaryButton onClick={send} disabled={busy}>
          {busy ? "Sending…" : "Send anonymously"}
        </PrimaryButton>
        <GhostButton onClick={() => navigate({ to: "/add/compose" as any })}>
          Edit words
        </GhostButton>
      </div>
    </SphereScreen>
  );
}
