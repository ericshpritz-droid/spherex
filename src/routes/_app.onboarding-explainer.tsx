import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PrimaryButton, Eyebrow } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/onboarding-explainer")({
  head: () => ({
    meta: [
      { title: "How sphere works" },
      { name: "description", content: "47 seconds. The whole idea." },
    ],
  }),
  component: ExplainerRoute,
});

const SEEN_KEY = "sphere.explainerSeen";

function ExplainerRoute() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Stub 47s "video" — we tick a progress bar so it feels real before a real
  // Mux/Vimeo URL is wired in. Replace <FakePlayer /> with a real player later.
  useEffect(() => {
    if (!playing) return;
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 47000);
      setProgress(p);
      if (p >= 1) {
        clearInterval(id);
        markSeen();
        navigate({ to: "/home", replace: true });
      }
    }, 100);
    return () => clearInterval(id);
  }, [playing, navigate]);

  function markSeen() {
    try {
      if (user?.id) localStorage.setItem(`mutual.onboarded.${user.id}`, "1");
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }

  function dismiss() {
    markSeen();
    navigate({ to: "/home", replace: true });
  }

  return (
    <div className="h-full w-full bg-ink text-paper font-sans flex flex-col">
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <div className="font-serif italic text-[18px]">sphere</div>
        <button onClick={dismiss} className="text-paper/70 text-[18px] -mr-1 px-2" aria-label="Close">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4" data-scroll>
        <Eyebrow className="text-paper/55">A 47-second explainer</Eyebrow>
        <h1 className="mt-3 font-serif italic text-[40px] leading-[1.02] tracking-tight">
          The whole idea, in less than a minute.
        </h1>
        <p className="mt-3 text-[14px] text-paper/70 leading-snug">
          Add up to three people. They never know unless they add you back. If they do — both of you reveal at the same moment. That's it.
        </p>

        {/* Player stub */}
        <div
          onClick={() => setPlaying(true)}
          className={cn(
            "mt-8 rounded-3xl bg-paper/[0.06] border border-paper/15",
            "aspect-video flex items-center justify-center cursor-pointer relative overflow-hidden",
          )}
        >
          {!playing ? (
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-paper text-ink flex items-center justify-center text-[18px]">
                ▶
              </div>
              <div className="mt-3 font-mono text-[10px] uppercase text-paper/55"
                style={{ letterSpacing: "0.22em" }}
              >
                Watch (47s)
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="font-serif italic text-[28px] text-paper/80">
                {progress < 0.33
                  ? "Add a person."
                  : progress < 0.66
                  ? "Sealed unless mutual."
                  : "Reveal together."}
              </div>
            </div>
          )}

          {/* progress bar */}
          <div className="absolute left-0 right-0 bottom-0 h-1 bg-paper/10">
            <div
              className="h-full bg-paper transition-[width] duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3">
        {!playing ? (
          <PrimaryButton
            onClick={() => setPlaying(true)}
            className="bg-paper text-ink"
          >
            Watch (47s)
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={dismiss} className="bg-paper text-ink">
            Skip to my sphere
          </PrimaryButton>
        )}
        <button
          onClick={dismiss}
          className="w-full font-sans text-[13px] text-paper/55 py-2"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
