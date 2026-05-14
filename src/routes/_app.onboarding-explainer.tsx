import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/mutual/AppContext";
import { cn } from "@/lib/utils";
import { haptics } from "@/mutual/native/haptics";

export const Route = createFileRoute("/_app/onboarding-explainer")({
  head: () => ({
    meta: [
      { title: "A quick tour — sphere" },
      { name: "description", content: "47 seconds. The whole idea." },
    ],
  }),
  component: ExplainerRoute,
});

const SEEN_KEY = "sphere.explainerSeen";
const TOTAL_S = 47;

function ExplainerRoute() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [mode, setMode] = useState<"watch" | "skip">("watch");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    startedAt.current = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - (startedAt.current || 0)) / (TOTAL_S * 1000));
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
    haptics.light();
    markSeen();
    navigate({ to: "/home", replace: true });
  }

  const elapsed = Math.floor(progress * TOTAL_S);
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const remaining = TOTAL_S - elapsed;

  return (
    <div className="h-full w-full bg-ink text-paper font-sans flex flex-col">
      {/* Top bar: countdown · × */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <div
          className="font-mono text-[12px] text-paper/70 tabular-nums"
        >
          {fmtTime(remaining)}
        </div>
        <button
          onClick={dismiss}
          aria-label="Close"
          className="text-paper/70 text-[22px] -mr-1 px-2 leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-2 pb-4" data-scroll>
        <h1 className="font-serif italic text-[34px] leading-[1.05] tracking-tight">
          A quick tour,<br />before you start.
        </h1>

        {/* Segmented Watch / Skip */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={() => { haptics.selection(); setMode("watch"); setPlaying(true); }}
            className={cn(
              "h-14 rounded-full border text-[15px] font-medium transition-colors active:scale-[0.97]",
              mode === "watch"
                ? "bg-paper text-ink border-paper"
                : "bg-transparent text-paper/80 border-paper/25",
            )}
          >
            Watch
            <span className="block text-[11px] font-mono opacity-70 mt-0.5"
              style={{ letterSpacing: "0.16em" }}>
              ({TOTAL_S}s)
            </span>
          </button>
          <button
            onClick={dismiss}
            className={cn(
              "h-14 rounded-full border text-[15px] font-medium transition-colors active:scale-[0.97]",
              "bg-transparent text-paper/80 border-paper/25",
            )}
          >
            Skip
          </button>
        </div>

        {/* Player frame — 9:16 placeholder */}
        <div
          onClick={() => !playing && (setMode("watch"), setPlaying(true))}
          className={cn(
            "mt-6 rounded-3xl bg-paper/[0.04] border border-paper/12",
            "aspect-[9/14] relative overflow-hidden cursor-pointer",
          )}
        >
          {/* Header strip */}
          <div className="absolute top-0 inset-x-0 px-5 pt-5 flex items-center justify-between">
            <div
              className="font-mono text-[10px] uppercase text-paper/55"
              style={{ letterSpacing: "0.22em" }}
            >
              Placeholder · {TOTAL_S}s
            </div>
            <div
              className="font-mono text-[10px] uppercase text-paper/55 flex items-center gap-1"
              style={{ letterSpacing: "0.22em" }}
            >
              Sound on <span aria-hidden>🔊</span>
            </div>
          </div>

          {/* Body — rotating tagline */}
          <div className="absolute inset-x-0 bottom-0 px-5 pb-7">
            <div className="font-serif italic text-[26px] leading-[1.1] text-paper/85">
              {!playing ? (
                <>How <span className="text-paper/55">three numbers</span><br />change everything.</>
              ) : progress < 0.34 ? (
                <>Add a <span className="text-paper/55">person.</span></>
              ) : progress < 0.67 ? (
                <>Sealed <span className="text-paper/55">unless mutual.</span></>
              ) : (
                <>Reveal <span className="text-paper/55">together.</span></>
              )}
            </div>
          </div>

          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-paper text-ink flex items-center justify-center text-[18px] shadow-lg">
                ▶
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom scrubber bar */}
      <div
        className="px-6 pt-2 flex items-center gap-3"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 1rem)` }}
      >
        <div className="font-mono text-[11px] tabular-nums text-paper/60">
          {fmtTime(elapsed)} / {fmtTime(TOTAL_S)}
        </div>
        <div className="flex-1 h-[2px] bg-paper/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-paper transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
