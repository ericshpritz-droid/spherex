import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, GhostButton, Eyebrow, ComplimentBubble } from "@/sphere/ui";
import {
  ADJECTIVES,
  ADVERBS,
  COMPLIMENT_KEY,
  DRAFT_KEY,
  FRAMES,
  renderCompliment,
  type ComplimentDraft,
  type FrameId,
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

function ComposeRoute() {
  const navigate = useNavigate();
  const [hasDraft, setHasDraft] = useState(false);
  const [frameId, setFrameId] = useState<FrameId>(FRAMES[0].id);
  const [adverb, setAdverb] = useState<string>(ADVERBS[0]);
  const [adjective, setAdjective] = useState<string>(ADJECTIVES[0]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) {
        navigate({ to: "/add/manual" as any, replace: true });
        return;
      }
      setHasDraft(true);
      // Restore prior compliment draft if user steps back from preview.
      const prior = sessionStorage.getItem(COMPLIMENT_KEY);
      if (prior) {
        const d = JSON.parse(prior) as ComplimentDraft;
        if (FRAMES.some((f) => f.id === d.frameId)) setFrameId(d.frameId);
        if (ADVERBS.includes(d.adverb as any)) setAdverb(d.adverb);
        if (ADJECTIVES.includes(d.adjective as any)) setAdjective(d.adjective);
      }
    } catch {
      navigate({ to: "/add/manual" as any, replace: true });
    }
  }, [navigate]);

  const preview = useMemo(
    () => renderCompliment({ frameId, adverb, adjective }),
    [frameId, adverb, adjective],
  );

  function next() {
    const draft: ComplimentDraft = { frameId, adverb, adjective };
    try {
      sessionStorage.setItem(COMPLIMENT_KEY, JSON.stringify(draft));
    } catch {}
    navigate({ to: "/add/preview" as any });
  }

  if (!hasDraft) return <SphereScreen>{null}</SphereScreen>;

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          onClick={() => navigate({ to: "/add/intent" as any })}
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
          Three small words.
        </h1>
        <p className="mt-3 text-[14px] text-mute">
          They'll see this anonymously. Sealed unless they pick you back.
        </p>

        <div className="mt-6">
          <ComplimentBubble body={preview} caption="Anonymous · preview" />
        </div>

        <Section label="Frame">
          <ChipRow
            options={FRAMES.map((f) => ({ value: f.id, label: f.label }))}
            value={frameId}
            onChange={(v) => setFrameId(v as FrameId)}
          />
        </Section>

        <Section label="Adverb">
          <ChipRow
            options={ADVERBS.map((w) => ({ value: w, label: w }))}
            value={adverb}
            onChange={setAdverb}
          />
        </Section>

        <Section label="Adjective">
          <ChipRow
            options={ADJECTIVES.map((w) => ({ value: w, label: w }))}
            value={adjective}
            onChange={setAdjective}
          />
        </Section>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3">
        <PrimaryButton onClick={next}>Preview anonymously</PrimaryButton>
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
            key={o.value}
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
