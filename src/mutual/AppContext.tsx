import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSession, formatE164, sendOtp, verifyOtp, signOut, toE164 } from "./auth";
import { addPhones, loadAddsAndMatches, type Person } from "./dataApi";
import { callGetMyPhoneHash, callHashPhones } from "./dataApi.rpc";
import { loadLastMessagesServer } from "./messages.functions";
import { useServerFn } from "@tanstack/react-start";

type Accent = "pink" | "lavender" | "blue";

type Ctx = {
  accent: Accent;
  setAccent: (a: Accent) => void;
  session: Session | null;
  sessionLoading: boolean;
  user: User | null;
  myPhone: string;
  myPhoneFormatted: string;
  matches: Person[];
  pending: Person[];
  dataLoading: boolean;
  dataError: string | null;
  refresh: () => Promise<void>;
  // Last message per matched hash + unread tracking
  lastByHash: Record<string, { body: string; sender_phone_hash: string; created_at: string }>;
  unreadByHash: Record<string, boolean>;
  markThreadRead: (otherHash: string) => void;
  myHash: string;
  // New-match awareness (separate from unread messages)
  newMatchCount: number;
  markMatchesSeen: () => void;
  // OTP flow
  pendingPhone: string;
  startOtp: (digits: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  // Adds
  lastAddedPhone: string;
  addOne: (digits: string) => Promise<void>;
  addMany: (formattedPhones: string[]) => Promise<void>;
  // Active match (for /match)
  activeMatch: Person | null;
  setActiveMatch: (m: Person | null) => void;
  // Sign out
  doSignOut: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const v = useContext(AppCtx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}

function friendlyError(e: unknown): string {
  const msg = (e as any)?.message || String(e);
  if (/network|fetch|failed to fetch/i.test(msg)) {
    return "Can't reach the network. Check your connection and try again.";
  }
  if (/jwt|auth|not authenticated/i.test(msg)) {
    return "Your session expired. Please sign in again.";
  }
  return msg || "Something went wrong. Please try again.";
}

// ---- Local hash → raw phone cache --------------------------------------
// We only know the readable form of phones the *current device* has uploaded.
// The cache is namespaced per user so multiple accounts on one browser don't
// leak names across sessions.
function hashCacheKey(userId: string | undefined): string {
  return `mutual.hashcache.${userId ?? "anon"}`;
}
function loadHashCache(userId: string | undefined): Map<string, string> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = localStorage.getItem(hashCacheKey(userId));
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string, string>;
    return new Map(Object.entries(obj));
  } catch {
    return new Map();
  }
}
function saveHashCache(userId: string | undefined, map: Map<string, string>) {
  if (typeof window === "undefined") return;
  const obj: Record<string, string> = {};
  for (const [k, v] of map) obj[k] = v;
  try {
    localStorage.setItem(hashCacheKey(userId), JSON.stringify(obj));
  } catch {}
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<Accent>(() => {
    if (typeof window === "undefined") return "pink";
    return (localStorage.getItem("mutual.accent") as Accent) || "pink";
  });
  const setAccent = useCallback((a: Accent) => {
    setAccentState(a);
    if (typeof window !== "undefined") localStorage.setItem("mutual.accent", a);
  }, []);

  const { session, loading: sessionLoading, user } = useSession();
  const myPhone = user?.phone ? `+${String(user.phone).replace(/\D/g, "")}` : "";
  const myPhoneFormatted = myPhone ? formatE164(myPhone) : "";

  const [matches, setMatches] = useState<Person[]>([]);
  const [pending, setPending] = useState<Person[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [pendingPhone, setPendingPhone] = useState("");
  const [lastAddedPhone, setLastAddedPhone] = useState("");
  const [activeMatch, setActiveMatch] = useState<Person | null>(null);

  // hash → raw phone (local-only, per user)
  const hashCacheRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    hashCacheRef.current = loadHashCache(user?.id);
  }, [user?.id]);

  // server-computed hash of my own phone (for realtime filtering)
  const [myHash, setMyHash] = useState<string>("");
  useEffect(() => {
    if (!session) { setMyHash(""); return; }
    let cancelled = false;
    callGetMyPhoneHash()
      .then((h) => { if (!cancelled) setMyHash(h); })
      .catch((e) => console.warn("getMyPhoneHash failed", e));
    return () => { cancelled = true; };
  }, [session]);

  const refresh = useCallback(async () => {
    if (!myPhone) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const { matches, pending } = await loadAddsAndMatches(myPhone, hashCacheRef.current);
      setMatches(matches);
      setPending(pending);
    } catch (e) {
      console.error("loadAddsAndMatches failed", e);
      setDataError(friendlyError(e));
    } finally {
      setDataLoading(false);
    }
  }, [myPhone]);

  useEffect(() => {
    if (session) refresh();
  }, [session, refresh]);

  // Realtime: when someone adds *me* a new mutual may have just been created.
  // Filter on my hashed phone (the column the DB now stores).
  const refreshRef = useRef(refresh);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);
  useEffect(() => {
    if (!session || !myHash) return;
    const channel = supabase
      .channel(`adds-for-${myHash.slice(0, 12)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "adds",
          filter: `added_phone_hash=eq.${myHash}`,
        },
        () => { refreshRef.current(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, myHash]);

  // ---- Last-message preview + unread tracking ---------------------------
  const loadLast = useServerFn(loadLastMessagesServer);
  const [lastByHash, setLastByHash] = useState<Record<string, { body: string; sender_phone_hash: string; created_at: string }>>({});

  // Per-thread "last seen" timestamps live in localStorage, namespaced by user.
  const seenKey = (uid: string | undefined) => `mutual.threadSeen.${uid ?? "anon"}`;
  const [seenByHash, setSeenByHash] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(seenKey(undefined)) || "{}"); } catch { return {}; }
  });
  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    try { setSeenByHash(JSON.parse(localStorage.getItem(seenKey(user.id)) || "{}")); } catch { setSeenByHash({}); }
  }, [user?.id]);

  const persistSeen = useCallback((next: Record<string, string>) => {
    setSeenByHash(next);
    if (typeof window !== "undefined") {
      try { localStorage.setItem(seenKey(user?.id), JSON.stringify(next)); } catch {}
    }
  }, [user?.id]);

  const refreshLast = useCallback(async () => {
    if (!session || !myHash) return;
    try {
      const res = await loadLast({ data: undefined as any });
      setLastByHash((res as any).lastByHash || {});
    } catch (e) {
      console.warn("loadLastMessages failed", e);
    }
  }, [session, myHash, loadLast]);

  useEffect(() => { refreshLast(); }, [refreshLast]);

  // Realtime: any new message I'm part of updates the preview + unread state.
  useEffect(() => {
    if (!session || !myHash) return;
    const channel = supabase
      .channel(`msgs-for-${myHash.slice(0, 12)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as { body: string; sender_phone_hash: string; recipient_phone_hash: string; created_at: string };
          const involvesMe = m.sender_phone_hash === myHash || m.recipient_phone_hash === myHash;
          if (!involvesMe) return;
          const other = m.sender_phone_hash === myHash ? m.recipient_phone_hash : m.sender_phone_hash;
          setLastByHash((prev) => {
            const cur = prev[other];
            if (cur && cur.created_at >= m.created_at) return prev;
            return { ...prev, [other]: { body: m.body, sender_phone_hash: m.sender_phone_hash, created_at: m.created_at } };
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        () => { refreshLast(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, myHash, refreshLast]);

  // A thread is unread when its last message is from *them* and newer than my
  // last-seen timestamp for that hash.
  const unreadByHash: Record<string, boolean> = {};
  for (const [hash, last] of Object.entries(lastByHash)) {
    if (last.sender_phone_hash === myHash) continue;
    const seen = seenByHash[hash];
    if (!seen || seen < last.created_at) unreadByHash[hash] = true;
  }

  const markThreadRead = useCallback((otherHash: string) => {
    const last = lastByHash[otherHash];
    const ts = last?.created_at || new Date().toISOString();
    const next = { ...seenByHash, [otherHash]: ts };
    persistSeen(next);
  }, [lastByHash, seenByHash, persistSeen]);

  // ---- New-match tracking ------------------------------------------------
  // Mirrors the seenByHash pattern: persist the set of match IDs the user has
  // already seen on /home, so realtime / refresh deltas show up as a dot.
  const seenMatchKey = (uid: string | undefined) => `mutual.matchesSeen.${uid ?? "anon"}`;
  const [seenMatchIds, setSeenMatchIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(seenMatchKey(undefined));
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch { return new Set(); }
  });
  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    try {
      const raw = localStorage.getItem(seenMatchKey(user.id));
      setSeenMatchIds(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch { setSeenMatchIds(new Set()); }
  }, [user?.id]);

  const matchIds = matches.map((m) => String(m.id));
  let newMatchCount = 0;
  for (const id of matchIds) if (!seenMatchIds.has(id)) newMatchCount++;

  const markMatchesSeen = useCallback(() => {
    if (matchIds.length === 0) return;
    const next = new Set(seenMatchIds);
    let changed = false;
    for (const id of matchIds) if (!next.has(id)) { next.add(id); changed = true; }
    if (!changed) return;
    setSeenMatchIds(next);
    if (typeof window !== "undefined") {
      try { localStorage.setItem(seenMatchKey(user?.id), JSON.stringify(Array.from(next))); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchIds.join("|"), seenMatchIds, user?.id]);

  const startOtp = useCallback(async (digits: string) => {
    const e164 = toE164(digits);
    setPendingPhone(e164);
    try {
      await sendOtp(e164);
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, []);

  const verifyCode = useCallback(async (code: string) => {
    try {
      await verifyOtp(pendingPhone, code);
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, [pendingPhone]);

  // After a successful add, ask the server to compute hashes for the just-
  // uploaded raw phones (using its pepper) and remember the mapping locally.
  // This is the *only* place a raw phone is associated with its hash, and
  // it lives only in this device's localStorage — never on the server.
  const rememberLocally = useCallback(async (e164s: string[]) => {
    if (e164s.length === 0) return;
    try {
      const hashes = await callHashPhones(e164s);
      const map = hashCacheRef.current;
      e164s.forEach((p, i) => { if (hashes[i]) map.set(hashes[i], p); });
      saveHashCache(user?.id, map);
    } catch (e) {
      console.warn("hashPhones failed (matches may show as 'Hidden contact')", e);
    }
  }, [user?.id]);

  const addOne = useCallback(async (digits: string) => {
    const e164 = toE164(digits);
    let added: string[] = [];
    try {
      added = await addPhones(myPhone, [e164]);
    } catch (e) {
      throw new Error(friendlyError(e));
    }
    setLastAddedPhone(formatE164(e164));
    await rememberLocally(added);
    refresh();
  }, [myPhone, refresh, rememberLocally]);

  const addMany = useCallback(async (formattedPhones: string[]) => {
    const e164s = formattedPhones.map((p) => toE164(p));
    let added: string[] = [];
    try {
      added = await addPhones(myPhone, e164s);
    } catch (e) {
      throw new Error(friendlyError(e));
    }
    if (e164s[0]) setLastAddedPhone(formatE164(e164s[0]));
    await rememberLocally(added);
    refresh();
  }, [myPhone, refresh, rememberLocally]);

  const doSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }, []);

  const value: Ctx = {
    accent, setAccent,
    session, sessionLoading, user,
    myPhone, myPhoneFormatted,
    matches, pending, dataLoading, dataError, refresh,
    pendingPhone, startOtp, verifyCode,
    lastAddedPhone, addOne, addMany,
    activeMatch, setActiveMatch,
    lastByHash, unreadByHash, markThreadRead, myHash,
    newMatchCount, markMatchesSeen,
    doSignOut,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
