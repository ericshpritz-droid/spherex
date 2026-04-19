import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { ScreenHome } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";
import { ACCENT_PRESETS } from "../mutual/brand.js";
import { callGetMyPhoneHash } from "../mutual/dataApi.rpc";
import { toast } from "../mutual/toast";
import { useContactPhotos } from "../mutual/native/useContactPhotos";
import { haptics } from "../mutual/native/haptics";

function celebrateMutual(accent: string) {
  const p = (ACCENT_PRESETS as any)[accent] || ACCENT_PRESETS.pink;
  const colors = [p.a, p.b, p.c, "#ffffff"];
  const defaults = { origin: { y: 0.35 }, colors, disableForReducedMotion: true };
  confetti({ ...defaults, particleCount: 80, spread: 70, startVelocity: 45, scalar: 1 });
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 50, spread: 100, startVelocity: 35, scalar: 0.9, origin: { x: 0.2, y: 0.4 } });
    confetti({ ...defaults, particleCount: 50, spread: 100, startVelocity: 35, scalar: 0.9, origin: { x: 0.8, y: 0.4 } });
  }, 180);
  // iOS taptic success notification — falls back to navigator.vibrate on web.
  haptics.success();
}

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Your mutuals — Sphere" },
      { name: "description", content: "See who picked you back." },
      { property: "og:title", content: "Your mutuals — Sphere" },
      { property: "og:description", content: "See who picked you back." },
    ],
  }),
  component: HomeRoute,
});

// Skip auto-refresh if the tab was hidden for less than this many ms,
// to avoid spamming the network on quick app-switches.
const MIN_HIDDEN_MS = 10_000;

function HomeRoute() {
  const { accent, matches, pending, setActiveMatch, dataLoading, dataError, refresh, lastByHash, unreadByHash, markThreadRead, myHash, markMatchesSeen, invitedByHash } = useApp();
  const { photos: photoByHash } = useContactPhotos();
  const navigate = useNavigate();
  const hasData = matches.length > 0 || pending.length > 0;

  // 30s ticker so relative-time labels ("2m", "1h") stay fresh without a refetch.
  const [, setNowTick] = useState(0);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setNowTick((n) => n + 1);
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // Sort: unread threads first, then by most-recent message activity,
  // falling back to existing order for matches with no messages yet.
  const sortedMatches = [...matches].sort((a: any, b: any) => {
    const aId = String(a.id);
    const bId = String(b.id);
    const aUnread = unreadByHash[aId] ? 1 : 0;
    const bUnread = unreadByHash[bId] ? 1 : 0;
    if (aUnread !== bUnread) return bUnread - aUnread;
    const aTs = lastByHash[aId]?.created_at || "";
    const bTs = lastByHash[bId]?.created_at || "";
    if (aTs !== bTs) return aTs < bTs ? 1 : -1;
    return 0;
  });

  // Track known mutuals to detect newly-arrived ones (via Realtime or refresh)
  const knownIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    // Wait until first successful load before tracking
    if (dataLoading) return;
    const ids = new Set(matches.map((m: any) => String(m.id ?? m.phone ?? m.other_phone)));
    if (knownIdsRef.current === null) {
      knownIdsRef.current = ids;
      return;
    }
    let isNew = false;
    for (const id of ids) {
      if (!knownIdsRef.current.has(id)) { isNew = true; break; }
    }
    if (isNew) celebrateMutual(accent);
    knownIdsRef.current = ids;
  }, [matches, dataLoading, accent]);

  // Once /home has been viewed with the latest matches loaded, clear the
  // "new mutuals" dot on the bottom-nav tab.
  useEffect(() => {
    if (dataLoading) return;
    markMatchesSeen();
  }, [matches, dataLoading, markMatchesSeen]);

  // Auto-refresh on tab visibility return
  const hiddenSince = useRef<number | null>(null);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenSince.current = Date.now();
      } else if (document.visibilityState === "visible") {
        const since = hiddenSince.current;
        hiddenSince.current = null;
        if (since != null && Date.now() - since >= MIN_HIDDEN_MS) {
          refresh();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refresh]);

  const handleInvite = useCallback(async () => {
    try {
      const hash = await callGetMyPhoneHash();
      if (!hash || typeof window === "undefined") return;
      const url = `${window.location.origin}/i/${hash}`;
      const text = "I'm on Sphere — add me and we're mutual. ✨";
      const nav = navigator as any;
      if (nav?.share) {
        try { await nav.share({ title: "Sphere", text, url }); return; } catch {}
      }
      try {
        await nav?.clipboard?.writeText(`${text} ${url}`);
        toast.success("Invite link copied");
      } catch { toast.error("Couldn't copy link"); }
    } catch (e: any) {
      toast.error(e?.message || "Couldn't build invite link");
    }
  }, []);

  const sortedPending = invitedByHash
    ? [...pending].sort((a: any, b: any) => {
        const ai = String(a.id) === invitedByHash ? 1 : 0;
        const bi = String(b.id) === invitedByHash ? 1 : 0;
        return bi - ai;
      })
    : pending;

  return (
    <ScreenHome
      accent={accent}
      matches={sortedMatches}
      pending={sortedPending}
      lastByHash={lastByHash}
      unreadByHash={unreadByHash}
      myHash={myHash}
      invitedByHash={invitedByHash}
      loading={dataLoading && !hasData}
      refreshing={dataLoading && hasData}
      error={dataError}
      onRetry={refresh}
      onOpenMatch={(m: any) => {
        markThreadRead(String(m.id));
        setActiveMatch(m);
        navigate({ to: "/thread/$hash", params: { hash: String(m.id) } });
      }}
      onAdd={() => navigate({ to: "/add" })}
      onInvite={handleInvite}
      onOpenProfile={() => navigate({ to: "/profile" })}
      photoByHash={photoByHash}
    />
  );
}
