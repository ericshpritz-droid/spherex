import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { WaitingCard } from "@/sphere/components/WaitingCard";
import { UpgradeSheet } from "@/sphere/components/UpgradeSheet";
import { ReceivedComplimentSheet } from "@/sphere/components/ReceivedComplimentSheet";
import { useApp } from "@/mutual/AppContext";
import { toast } from "@/mutual/toast";
import { callLoadInboxCompliments, type InboxCompliment } from "@/mutual/compliments.rpc";
import { DRAFT_KEY } from "@/sphere/compliments/words";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Your sphere — sphere" },
      { name: "description", content: "Sealed picks. Quiet until mutual." },
    ],
  }),
  component: HomeRoute,
});

const FREE_LIMIT = 1;
const SPHERE_PLUS_LIMIT = 3;

function displayName(p: any): string {
  if (!p.unknown) return p.name;
  return p.status === "matched" ? "New mutual" : "Sealed pick";
}

function HomeRoute() {
  const { matches, pending, dataLoading, refresh, markMatchesSeen } = useApp();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [isPlus, setIsPlus] = useState(false); // local-only; Stripe wires in later

  useEffect(() => {
    if (!dataLoading) markMatchesSeen();
  }, [dataLoading, markMatchesSeen]);

  // Surface a fresh received compliment once.
  const [received, setReceived] = useState<InboxCompliment | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("sphere.seenCompliments") || "[]")); }
    catch { return new Set(); }
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

  const dismissReceived = useCallback(() => {
    if (!received) return;
    const next = new Set(seenIds);
    next.add(received.id);
    setSeenIds(next);
    try { localStorage.setItem("sphere.seenCompliments", JSON.stringify([...next])); } catch {}
    setReceived(null);
  }, [received, seenIds]);

  const myPicks = [...matches, ...pending];
  const slotLimit = isPlus ? SPHERE_PLUS_LIMIT : FREE_LIMIT;
  const slotsUsed = Math.min(myPicks.length, SPHERE_PLUS_LIMIT);
  const atLimit = myPicks.length >= slotLimit;
  const empty = myPicks.length === 0;

  function onAddPerson() {
    if (atLimit && !isPlus) {
      setUpgradeOpen(true);
    } else {
      navigate({ to: "/add" });
    }
  }

  function startCompliment(p: any) {
    // Seed compose draft for an existing pending pick.
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          phoneHash: String(p.id),
          intent: "compliment",
          recipientName: displayName(p),
          returnTo: "/home",
        }),
      );
    } catch {}
    navigate({ to: "/add/compose" as any });
  }

  return (
    <SphereScreen dark>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <div className="flex items-center gap-2 font-serif italic text-[22px] text-paper">
          <span className="text-paper/80 text-[18px]">⊕</span>
          sphere
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: "/contacts" })}
            className="text-paper/60 text-[18px] leading-none bg-transparent border-0 cursor-pointer"
            aria-label="Manage contacts"
          >
            ☰
          </button>
          <button
            onClick={refresh}
            className="text-paper/60 text-[14px] bg-transparent border-0 cursor-pointer"
            aria-label="Refresh"
          >
            {dataLoading ? "…" : "↻"}
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <div
          className="font-mono text-[10px] uppercase text-fg-50"
          style={{ letterSpacing: "0.28em" }}
        >
          Your Sphere
        </div>
        <div
          className="font-mono text-[10px] uppercase text-fg-50"
          style={{ letterSpacing: "0.28em" }}
        >
          {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4" data-scroll>
        {empty ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {myPicks.map((p: any, i: number) => (
              <WaitingCard
                key={String(p.id)}
                index={i + 1}
                name={displayName(p)}
                onSendCompliment={() => {
                  if (p.status === "matched") {
                    navigate({ to: "/thread/$hash", params: { hash: String(p.id) } });
                  } else {
                    startCompliment(p);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pt-2 pb-6">
        <button
          type="button"
          onClick={onAddPerson}
          className="w-full h-14 rounded-full border border-fg-25 bg-transparent text-paper font-serif italic text-[17px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <span className="text-[16px]">+</span>
          <span>{empty ? "add your first person" : "add another person"}</span>
        </button>
      </div>

      <UpgradeSheet
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        filled={slotsUsed}
        onConfirmUpgrade={() => {
          setIsPlus(true);
          setUpgradeOpen(false);
          toast("Sphere+ unlocked");
          navigate({ to: "/add" });
        }}
      />

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
          onKeep={() => { toast("Kept. Quiet brightness."); dismissReceived(); }}
          onClose={dismissReceived}
        />
      )}
    </SphereScreen>
  );
}

function EmptyState() {
  return (
    <div className="mt-16 text-center px-6">
      <div className="mx-auto w-[120px] h-[120px] rounded-full"
        style={{
          background: "radial-gradient(circle at center, rgba(230,196,106,0.25), rgba(230,196,106,0) 70%)",
        }}
      />
      <h1 className="mt-4 font-serif italic text-[32px] leading-tight text-paper">
        Your sphere is empty.
      </h1>
      <p className="mt-3 text-[14px] text-fg-55 leading-snug">
        Add someone. They never know unless they pick you back.
      </p>
    </div>
  );
}
