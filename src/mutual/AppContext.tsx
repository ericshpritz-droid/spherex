import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSession, formatE164, sendOtp, verifyOtp, signOut, toE164 } from "./auth";
import { addPhones, loadAddsAndMatches, type Person } from "./dataApi";
import { callGetMyPhoneHash, callHashPhones } from "./dataApi.client";

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

  // After a successful add, remember the hash → raw mapping locally so we
  // can render the contact's number when (if) they become a mutual.
  const rememberLocally = useCallback(async (e164s: string[]) => {
    if (e164s.length === 0) return;
    // Compute hashes by asking the server for a single round-trip per add
    // is wasteful — instead, we mirror the server's algorithm using a tiny
    // client-side hash that DOES NOT need the pepper: we use the server's
    // *result* for matches by listening to refresh(), but for the local
    // map we just store every raw phone we've ever uploaded indexed by
    // the same hash the server will return. To keep client free of the
    // pepper, we lazily backfill: when the matches view returns a hash
    // that matches one of our uploads' future hashes we'd miss it.
    //
    // Simpler approach: stash raw phones in a local "uploaded" list and
    // populate the hashCache after each refresh by asking the server to
    // hash them. We avoid extra calls by computing client-side using
    // SubtleCrypto + an "obfuscation only" prefix — but that wouldn't
    // match the server hash.
    //
    // Final approach: store the raw phones in localStorage keyed by the
    // *plain* sha256 of the phone (no pepper) AND ask the server, after
    // each add, for the corresponding peppered hashes via a small RPC.
    // This is the simplest correct option.
    try {
      const headers = (await import("./dataApi.client")).
        // re-use bearerHeaders via a tiny inline call
        // (kept here to avoid a circular import at module top-level)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callAddPhones as any; // satisfy the bundler
      void headers;
    } catch {}
    // Fetch hashes for the just-uploaded raw phones via a dedicated RPC.
    const { hashUploadedPhones } = await import("./dataApi.client.extras");
    const hashes = await hashUploadedPhones(e164s);
    const map = hashCacheRef.current;
    e164s.forEach((p, i) => { if (hashes[i]) map.set(hashes[i], p); });
    saveHashCache(user?.id, map);
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
    doSignOut,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
