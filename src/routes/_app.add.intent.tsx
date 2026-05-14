import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, IntentCard, Eyebrow } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
import { toast } from "@/mutual/toast";

export const Route = createFileRoute("/_app/add/intent")({
  head: () => ({
    meta: [
      { title: "What do you want from this? — sphere" },
      { name: "description", content: "Pick how you want to be matched." },
    ],
  }),
  component: IntentRoute,
});

const DRAFT_KEY = "sphere.addDraft";
type Intent = "romantic" | "compliment" | "both";

function IntentRoute() {
  const navigate = useNavigate();
  const { addOne } = useApp();
  const [draft, setDraft] = useState<{ phone: string; ig: string } | null>(null);
  const [intent, setIntent] = useState<Intent>("both");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) {
        navigate({ to: "/add/manual" as any, replace: true });
        return;
      }
      setDraft(JSON.parse(raw));
    } catch {
      navigate({ to: "/add/manual" as any, replace: true });
    }
  }, [navigate]);

  async function commit() {
    if (!draft || busy) return;
    setBusy(true);
    try {
      await addOne(draft.phone, intent);
      try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
      // Compliment / both paths route to composer in Phase 4.
      // For Phase 3, every intent ends at the patience screen.
      navigate({ to: "/add/patience" as any, replace: true });
    } catch (e: any) {
      toast(e?.message || "Could not save your pick.");
      setBusy(false);
    }
  }

  if (!draft) return <SphereScreen>{null}</SphereScreen>;

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          onClick={() => navigate({ to: "/add/confirm" as any })}
          className="text-ink/80 text-[18px] -ml-1 px-2"
          aria-label="Back"
        >
          ←
        </button>
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4" data-scroll>
        <Eyebrow>How do you want to match?</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[36px] leading-[1.04] tracking-tight">
          Set the intent.
        </h1>
        <p className="mt-3 text-[14px] text-mute">
          You can always change it later by re-adding.
        </p>

        <div className="mt-7 space-y-3">
          <IntentCard
            label="OPTION 01"
            title="Romantic only."
            body="A sealed pick. Nothing is sent unless they pick you back."
            selected={intent === "romantic"}
            onClick={() => setIntent("romantic")}
          />
          <IntentCard
            label="OPTION 02"
            title="Compliment only."
            body="An anonymous, mad-lib note. They can guess but you stay sealed."
            selected={intent === "compliment"}
            onClick={() => setIntent("compliment")}
          />
          <IntentCard
            label="OPTION 03"
            title="Both."
            body="Send a compliment now. Match if they pick back."
            badge="MOST POPULAR"
            inverted={intent === "both"}
            selected={intent === "both"}
            onClick={() => setIntent("both")}
          />
        </div>
      </div>

      <div className="px-6 pb-8 pt-4">
        <PrimaryButton onClick={commit} disabled={busy}>
          {busy ? "Saving…" : "Continue"}
        </PrimaryButton>
        {(intent === "compliment" || intent === "both") && (
          <div className="mt-3 text-center font-mono text-[10px] uppercase text-mute"
            style={{ letterSpacing: "0.22em" }}
          >
            Compliment composer arrives in Phase 4
          </div>
        )}
      </div>
    </SphereScreen>
  );
}
