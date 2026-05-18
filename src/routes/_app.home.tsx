import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";

import { AvatarMono, initialsFromHash } from "@/sphere/components/AvatarMono";
import { ReceivedComplimentSheet } from "@/sphere/components/ReceivedComplimentSheet";
import { SwipeRevealRow } from "@/sphere/components/SwipeRevealRow";
import { PrimaryButton, Eyebrow } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
import { toast } from "@/mutual/toast";
import { callLoadInboxCompliments, type InboxCompliment } from "@/mutual/compliments.rpc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Your sphere — sphere" },
      { name: "description", content: "Three picks. Sealed unless mutual." },
    ],
  }),
  component: HomeRoute,
});

const FREE_LIMIT = 1;
const SPHERE_PLUS_LIMIT = 3;

function intentLabel(intent: string | undefined): string {
  switch (intent) {
    case "compliment": return "Compliment";
    case "both": return "Both";
    default: return "Romantic";
  }
}

function HomeRoute() {
  const {
    matches, pending, dataLoading, dataError, refresh, markMatchesSeen, removePending,
  } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!dataLoading) markMatchesSeen();
  }, [dataLoading, markMatchesSeen]);

  // Surface the most-recent received compliment as a "push-style" modal once.
  const [received, setReceived] = useState<InboxCompliment | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("sphere.seenCompliments") || "[]"));
    } catch { return new Set(); }
  });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await callLoadInboxCompliments();
        if (cancelled) return;
        const fresh = rows.find((r) => !seenIds.has(r.id));
        if (fresh) setReceived(fresh);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [seenIds]);

  function dismissReceived() {
    if (!received) return;
    const next = new Set(seenIds);
    next.add(received.id);
    setSeenIds(next);
    try {
      localStorage.setItem("sphere.seenCompliments", JSON.stringify([...next]));
    } catch {}
    setReceived(null);
  }

  // Picks = pending I added + matched mutuals (each consumes a slot).
  const myPicks = [...matches, ...pending];
  const isPlus = false; // Sphere+ comes in Phase 5
  const slotLimit = isPlus ? SPHERE_PLUS_LIMIT : FREE_LIMIT;
  const slotsUsed = Math.min(myPicks.length, slotLimit);
  const empty = myPicks.length === 0;

  return (
    <SphereScreen>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <div className="font-serif italic text-[22px]">sphere</div>
        <button
          onClick={refresh}
          className="text-mute text-[14px]"
          aria-label="Refresh"
        >
          {dataLoading ? "…" : "↻"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4" data-scroll>
        <Eyebrow>Your sphere</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[34px] leading-[1.05] tracking-tight">
          {empty ? "Three picks. Sealed unless mutual." : "Waiting for magic to happen."}
        </h1>

        {/* Slot row — dashed circles for empty, filled circles for used */}
        <div className="mt-7 flex items-center gap-3">
          {Array.from({ length: slotLimit }).map((_, i) => {
            const filled = i < slotsUsed;
            return (
              <div
                key={i}
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center",
                  filled
                    ? "bg-ink text-paper"
                    : "border border-dashed border-[#C9C5BC] text-mute",
                )}
              >
                <span className="font-sans text-[14px]">{i + 1}</span>
              </div>
            );
          })}
          <div className="ml-auto font-mono text-[10px] uppercase text-mute"
            style={{ letterSpacing: "0.22em" }}
          >
            Slot {slotsUsed} of {slotLimit}
          </div>
        </div>

        {/* Pick cards */}
        {myPicks.length > 0 && (
          <div className="mt-7 space-y-3">
            {myPicks.map((p: any) => {
              const id = String(p.id || "");
              const initials = initialsFromHash(id);
              const matched = p.status === "matched";
              const row = (
                <div
                  className="rounded-2xl bg-surface border border-line p-4 flex items-center gap-4"
                >
                  <AvatarMono initials={initials} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-[20px] leading-tight truncate">
                      {p.unknown ? (matched ? "New mutual" : "Sealed pick") : p.name}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase text-mute"
                      style={{ letterSpacing: "0.22em" }}
                    >
                      {intentLabel(p.intent)} · {matched ? "Mutual" : "Pending"}
                    </div>
                  </div>
                  {matched ? (
                    <button
                      onClick={() =>
                        navigate({ to: "/thread/$hash", params: { hash: id } })
                      }
                      className="rounded-full border border-ink h-9 px-4 text-[12px] font-medium"
                    >
                      Open
                    </button>
                  ) : (
                    <button
                      onClick={() => toast("Nudge sent. They'll get a fresh ping.")}
                      className="rounded-full border border-ink h-9 px-4 text-[12px] font-medium"
                    >
                      Nudge
                    </button>
                  )}
                </div>
              );
              if (matched) {
                return <div key={id}>{row}</div>;
              }
              return (
                <SwipeRevealRow
                  key={id}
                  actionLabel="Remove"
                  onAction={async () => {
                    try {
                      await removePending(id);
                      toast("Pick removed.");
                    } catch (e: any) {
                      toast(e?.message || "Couldn't remove pick.");
                    }
                  }}
                >
                  {row}
                </SwipeRevealRow>
              );
            })}
          </div>
        )}

        {/* Empty state body */}
        {empty && (
          <p className="mt-6 text-[14px] text-mute leading-snug">
            Add a person by number, contact, or Instagram. They'll never know unless they pick you back.
          </p>
        )}

        {/* Sphere+ card (always shown when at limit, soft prompt when not) */}
        {slotsUsed >= slotLimit && !isPlus && (
          <div className="mt-8 rounded-2xl bg-[#EFECE5] p-5">
            <Eyebrow>Free limit reached</Eyebrow>
            <div className="mt-2 font-serif italic text-[24px] leading-tight">
              Add up to three with Sphere+.
            </div>
            <div className="mt-1 text-[13px] text-mute">
              $9.99 / month · cancel anytime.
            </div>
            <div className="mt-4">
              <PrimaryButton onClick={() => navigate({ to: "/upgrade" as any })}>
                Upgrade
              </PrimaryButton>
            </div>
          </div>
        )}

        {dataError && (
          <div className="mt-6 text-[12px] text-danger">{dataError}</div>
        )}

        <div className="h-6" />
      </div>

      {/* Sticky add CTA (only when slots remain) */}
      {slotsUsed < slotLimit && (
        <div className="px-6 pt-2 pb-3">
          <PrimaryButton onClick={() => navigate({ to: "/add" })}>
            Number, contact, or Instagram +
          </PrimaryButton>
        </div>
      )}

      

      {received && (
        <ReceivedComplimentSheet
          body={received.body}
          candidates={myPicks.map((p: any) => ({
            id: String(p.id),
            name: p.unknown ? undefined : p.name,
            unknown: p.unknown,
          }))}
          onGuess={(id) => {
            if (id) toast("Guess locked. We'll tell you only if it's mutual.");
            else toast("No guess saved.");
            dismissReceived();
          }}
          onKeep={() => {
            toast("Kept. Quiet brightness.");
            dismissReceived();
          }}
          onClose={dismissReceived}
        />
      )}
    </SphereScreen>
  );
}
