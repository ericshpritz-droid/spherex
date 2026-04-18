import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSession, formatE164, sendOtp, verifyOtp, signOut, toE164 } from "./auth";
import { addPhones, loadAddsAndMatches, type Person } from "./dataApi";

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

  const refresh = useCallback(async () => {
    if (!myPhone) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const { matches, pending } = await loadAddsAndMatches(myPhone);
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

  // Realtime: when someone adds *me* (added_phone === myPhone), a new mutual
  // may have just been created. Re-fetch matches/pending so the home screen
  // updates live without a manual refresh.
  const refreshRef = useRef(refresh);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);
  useEffect(() => {
    if (!session || !myPhone) return;
    const channel = supabase
      .channel(`adds-for-${myPhone}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "adds",
          filter: `added_phone=eq.${myPhone}`,
        },
        () => { refreshRef.current(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, myPhone]);

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

  const addOne = useCallback(async (digits: string) => {
    const e164 = toE164(digits);
    try {
      await addPhones(myPhone, [e164]);
    } catch (e) {
      throw new Error(friendlyError(e));
    }
    setLastAddedPhone(formatE164(e164));
    refresh();
  }, [myPhone, refresh]);

  const addMany = useCallback(async (formattedPhones: string[]) => {
    const e164s = formattedPhones.map((p) => toE164(p));
    try {
      await addPhones(myPhone, e164s);
    } catch (e) {
      throw new Error(friendlyError(e));
    }
    if (e164s[0]) setLastAddedPhone(formatE164(e164s[0]));
    refresh();
  }, [myPhone, refresh]);

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
