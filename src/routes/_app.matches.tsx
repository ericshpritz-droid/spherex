import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SphereScreen } from "@/sphere/components/SphereScreen";

import { AvatarMono, initialsFromHash } from "@/sphere/components/AvatarMono";
import { Eyebrow } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";

export const Route = createFileRoute("/_app/matches")({
  head: () => ({
    meta: [
      { title: "Matches — sphere" },
      { name: "description", content: "The picks that picked you back." },
    ],
  }),
  component: MatchesRoute,
});

function MatchesRoute() {
  const { matches } = useApp();
  const navigate = useNavigate();

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <div className="font-serif italic text-[22px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-8" data-scroll>
        <Eyebrow>Matches</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[34px] leading-[1.05] tracking-tight">
          Mutual. Always.
        </h1>
        <p className="mt-3 text-[14px] text-mute">
          When you both picked each other. Tap to open the thread.
        </p>

        {matches.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#D8D5D0] p-6 text-center">
            <div className="font-serif italic text-[20px] text-ink/80">
              No matches yet.
            </div>
            <div
              className="mt-3 font-mono text-[10px] uppercase text-mute"
              style={{ letterSpacing: "0.22em" }}
            >
              Patience is part of it
            </div>
          </div>
        ) : (
          <div className="mt-7 space-y-3">
            {matches.map((p: any) => {
              const id = String(p.id || "");
              const initials = initialsFromHash(id);
              return (
                <button
                  key={id}
                  onClick={() => navigate({ to: "/thread/$hash", params: { hash: id } })}
                  className="w-full text-left rounded-2xl bg-surface border border-line p-4 flex items-center gap-4 hover:border-ink/40 transition-colors"
                >
                  <AvatarMono initials={initials} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-[20px] leading-tight truncate">
                      {p.unknown ? "New mutual" : p.name}
                    </div>
                    <div
                      className="mt-0.5 font-mono text-[10px] uppercase text-mute"
                      style={{ letterSpacing: "0.22em" }}
                    >
                      Mutual · open thread
                    </div>
                  </div>
                  <span className="text-mute">›</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <TabBar />
    </SphereScreen>
  );
}
