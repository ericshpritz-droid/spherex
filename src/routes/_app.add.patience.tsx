import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, Eyebrow } from "@/sphere/ui";

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

      <div className="px-6 pb-8 pt-4">
        <PrimaryButton onClick={() => navigate({ to: "/home", replace: true })}>
          I'm in — take me to my sphere
        </PrimaryButton>
      </div>
    </SphereScreen>
  );
}
