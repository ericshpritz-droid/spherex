import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, GhostButton, Eyebrow, ComplimentBubble } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
import { toast } from "@/mutual/toast";
import { callSendCompliment } from "@/mutual/compliments.rpc";
import {
  ADJECTIVES,
  ADVERBS,
  COMPLIMENT_KEY,
  DRAFT_KEY,
  renderCompliment,
  type AdjectiveValue,
  type AdverbValue,
  type ComplimentDraft,
} from "@/sphere/compliments/words";

export const Route = createFileRoute("/_app/add/compose")({
  head: () => ({
    meta: [
      { title: "Compose a compliment — sphere" },
      { name: "description", content: "Pick the words. Stay anonymous." },
    ],
  }),
  component: ComposeRoute,
});

type AddDraft = {
  phone?: string;
  phoneHash?: string;
  ig?: string;
  intent?: "romantic" | "compliment" | "both";
  recipientName?: string;
  returnTo?: string;
};

function ComposeRoute() {
  const navigate = useNavigate();
  const { addOne } = useApp();
  const [draft, setDraft] = useState<AddDraft | null>(null);
  const [adverb, setAdverb] = useState<AdverbValue>(ADVERBS[0].value);
  const [adjective, setAdjective] = useState<AdjectiveValue>(ADJECTIVES[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) {
        navigate({ to: "/home" as any, replace: true });
        return;
      }
      const parsed = JSON.parse(raw) as AddDraft;
      if (!parsed.phone && !parsed.phoneHash) {
        navigate({ to: "/home" as any, replace: true });
        return;
      }
      setDraft(parsed);
      const prior = sessionStorage.getItem(COMPLIMENT_KEY);
      if (prior) {
        const d = JSON.parse(prior) as ComplimentDraft;
        if (ADVERBS.some((a) => a.value === d.adverb)) setAdverb(d.adverb);
        if (ADJECTIVES.includes(d.adjective)) setAdjective(d.adjective);
      }
    } catch {
      navigate({ to: "/home" as any, replace: true });
    }
  }, [navigate]);

  const body = useMemo(
    () => renderCompliment({ adverb, adjective }),
    [adverb, adjective],
  );

  const goBack = () => {
    if (draft?.returnTo) {
      navigate({ to: draft.returnTo as any });
    } else {
      navigate({ to: "/home" as any });
    }
  };

  async function send() {
    if (!draft || busy) return;
    setBusy(true);
    try {
      const intent = (draft.intent ?? "compliment") as "compliment" | "both";
      // For "both" (pre-match legacy), record the romantic add first.
      if (intent === "both" && draft.phone) {
        try { await addOne(draft.phone, "both"); } catch { /* non-fatal */ }
      }
      await callSendCompliment({
        recipientPhone: draft.phone,
        recipientPhoneHash: draft.phoneHash,
        adverb,
        adjective,
        body,
        intent,
      });
      const returnTo = draft.returnTo;
      try {
        sessionStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem(COMPLIMENT_KEY);
      } catch {}
      toast("Compliment sent ✨");
      if (returnTo) {
        navigate({ to: returnTo as any, replace: true });
      } else {
        navigate({ to: "/home" as any, replace: true });
      }
    } catch (e: any) {
      toast(e?.message || "Could not send.");
      setBusy(false);
    }
  }

  if (!draft) return <SphereScreen>{null}</SphereScreen>;

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          onClick={goBack}
          className="text-ink/80 text-[18px] -ml-1 px-2"
          aria-label="Back"
        >
          ←
        </button>
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>


      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4" data-scroll>
        <Eyebrow>Compose a compliment</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[34px] leading-[1.05] tracking-tight">
          Two small words.
        </h1>
        <p className="mt-3 text-[14px] text-mute">
          Anonymous to them. Sealed unless they pick you back.
        </p>

        <div className="mt-6">
          <ComplimentBubble body={body} caption="Anonymous · preview" />
        </div>

        <Section label="Adverb">
          <ChipRow
            options={ADVERBS.map((a) => ({ value: a.value, label: a.label }))}
            value={adverb}
            onChange={(v) => setAdverb(v as AdverbValue)}
          />
        </Section>

        <Section label="Adjective">
          <ChipRow
            options={ADJECTIVES.map((w) => ({ value: w, label: w }))}
            value={adjective}
            onChange={(v) => setAdjective(v as AdjectiveValue)}
          />
        </Section>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3">
        <PrimaryButton onClick={send} disabled={busy}>
          {busy ? "Sending…" : "Send anonymously"}
        </PrimaryButton>
        <GhostButton onClick={() => navigate({ to: "/add/intent" as any })}>
          Back
        </GhostButton>
      </div>
    </SphereScreen>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-7">
      <div
        className="font-mono text-[10px] uppercase text-mute mb-3"
        style={{ letterSpacing: "0.22em" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value || "skip"}
            type="button"
            onClick={() => onChange(o.value)}
            className={[
              "rounded-full px-4 h-10 text-[14px] transition-colors",
              "border",
              selected
                ? "bg-ink text-paper border-ink"
                : "bg-transparent text-ink border-[#D8D5D0] hover:border-ink/50",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
