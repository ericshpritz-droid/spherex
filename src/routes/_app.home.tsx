import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";

import { AvatarMono, initialsFromHash } from "@/sphere/components/AvatarMono";
import { ReceivedComplimentSheet } from "@/sphere/components/ReceivedComplimentSheet";
import { SwipeRevealRow } from "@/sphere/components/SwipeRevealRow";
import { PrimaryButton, Eyebrow } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
import { toast } from "@/mutual/toast";
import { callLoadInboxCompliments, type InboxCompliment } from "@/mutual/compliments.rpc";

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

type Labels = Record<string, string>;
const labelKey = (uid: string | undefined) => `mutual.contactLabels.${uid ?? "anon"}`;
function loadLabels(uid: string | undefined): Labels {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(labelKey(uid)) || "{}"); } catch { return {}; }
}
function writeLabels(uid: string | undefined, l: Labels) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(labelKey(uid), JSON.stringify(l)); } catch {}
}

// Device-only block list: blocked hashes can be silently re-added later but
// won't show in the sphere until the user unblocks. Stored per-account.
const blockKey = (uid: string | undefined) => `mutual.blocked.${uid ?? "anon"}`;
function loadBlocked(uid: string | undefined): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(blockKey(uid)) || "[]"); } catch { return []; }
}
function writeBlocked(uid: string | undefined, list: string[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(blockKey(uid), JSON.stringify(list)); } catch {}
}

function HomeRoute() {
  const {
    matches, pending, dataLoading, dataError, refresh, markMatchesSeen, removePending, user,
  } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!dataLoading) markMatchesSeen();
  }, [dataLoading, markMatchesSeen]);

  // Per-user private labels (device-only), shared with /contacts page.
  const [labels, setLabels] = useState<Labels>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    setLabels(loadLabels(user?.id));
    setBlocked(loadBlocked(user?.id));
  }, [user?.id]);
  const persistLabels = useCallback((next: Labels) => {
    setLabels(next);
    writeLabels(user?.id, next);
  }, [user?.id]);
  const persistBlocked = useCallback((next: string[]) => {
    setBlocked(next);
    writeBlocked(user?.id, next);
  }, [user?.id]);

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

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setDraft("");
    } else {
      setExpandedId(id);
      setDraft(labels[id] || "");
    }
  }

  function saveLabel(id: string) {
    const value = draft.trim().slice(0, 60);
    const next = { ...labels };
    if (value) next[id] = value; else delete next[id];
    persistLabels(next);
    setExpandedId(null);
    setDraft("");
    toast(value ? "Label saved" : "Label cleared");
  }

  async function removeFromHome(id: string, matched: boolean) {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        matched ? "Remove this match? This unmatches you." : "Remove this pending pick?",
      );
      if (!ok) return;
    }
    try {
      await removePending(id);
      if (labels[id]) {
        const next = { ...labels };
        delete next[id];
        persistLabels(next);
      }
      setExpandedId(null);
      toast("Removed");
    } catch (e: any) {
      toast(e?.message || "Couldn't remove");
    }
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: "/contacts" })}
            className="text-mute text-[18px] leading-none bg-transparent border-0 cursor-pointer"
            aria-label="Manage contacts"
            title="Manage contacts"
          >
            ☰
          </button>
          <button
            onClick={refresh}
            className="text-mute text-[14px] bg-transparent border-0 cursor-pointer"
            aria-label="Refresh"
          >
            {dataLoading ? "…" : "↻"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4" data-scroll>
        <Eyebrow>Your sphere</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[34px] leading-[1.05] tracking-tight">
          {empty ? "Three picks. Sealed unless mutual." : "Waiting for magic to happen."}
        </h1>

        {/* Slot counter */}
        <div className="mt-7 flex items-center">
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
              const label = labels[id] || "";
              const baseName = p.unknown ? (matched ? "New mutual" : "Sealed pick") : p.name;
              const displayName = label || baseName;
              const isExpanded = expandedId === id;

              const row = (
                <div className="rounded-2xl bg-surface border border-line p-4">
                  <button
                    type="button"
                    onClick={() => toggleExpand(id)}
                    className="w-full flex items-center gap-4 bg-transparent border-0 cursor-pointer text-left p-0"
                    aria-expanded={isExpanded}
                    aria-label={`Edit ${displayName}`}
                  >
                    <AvatarMono initials={initials} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-[20px] leading-tight truncate">
                        {displayName}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase text-mute"
                        style={{ letterSpacing: "0.22em" }}
                      >
                        {intentLabel(p.intent)} · {matched ? "Mutual" : "Pending"}
                        {label ? " · labeled" : ""}
                      </div>
                    </div>
                    {matched ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({ to: "/thread/$hash", params: { hash: id } });
                        }}
                        className="rounded-full border border-ink h-9 px-4 text-[12px] font-medium inline-flex items-center"
                      >
                        Open
                      </span>
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toast("Nudge sent. They'll get a fresh ping.");
                        }}
                        className="rounded-full border border-ink h-9 px-4 text-[12px] font-medium inline-flex items-center"
                      >
                        Nudge
                      </span>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-line">
                      <label
                        className="block font-mono text-[10px] uppercase text-mute mb-2"
                        style={{ letterSpacing: "0.22em" }}
                      >
                        Private label
                      </label>
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveLabel(id);
                          if (e.key === "Escape") { setExpandedId(null); setDraft(""); }
                        }}
                        maxLength={60}
                        placeholder="e.g. coffee shop in Brooklyn"
                        className="w-full bg-paper border border-line rounded-md px-3 py-2 text-[14px] text-ink outline-none focus:border-ink/60"
                      />
                      <p className="mt-2 text-[11px] text-mute">
                        Stored on this device only. Never uploaded.
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                        <button
                          onClick={() => removeFromHome(id, matched)}
                          className="rounded-full text-[12px] font-semibold cursor-pointer bg-danger text-paper border-0"
                          style={{ padding: "8px 14px" }}
                        >
                          Remove
                        </button>
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            onClick={() => { setExpandedId(null); setDraft(""); }}
                            className="rounded-full text-[12px] font-semibold cursor-pointer bg-transparent text-ink border border-line"
                            style={{ padding: "8px 14px" }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveLabel(id)}
                            className="rounded-full text-[12px] font-semibold cursor-pointer bg-ink text-paper border-0"
                            style={{ padding: "8px 14px" }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
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
                      if (labels[id]) {
                        const next = { ...labels };
                        delete next[id];
                        persistLabels(next);
                      }
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

        {/* Manage contacts link — always available */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate({ to: "/contacts" })}
            className="font-mono text-[10px] uppercase text-mute bg-transparent border-0 cursor-pointer underline-offset-4 hover:underline"
            style={{ letterSpacing: "0.22em" }}
          >
            Manage contacts →
          </button>
        </div>


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
