import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
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
  const [pendingPhone, setPendingPhone] = useState("");
  const [lastAddedPhone, setLastAddedPhone] = useState("");
  const [activeMatch, setActiveMatch] = useState<Person | null>(null);

  const refresh = useCallback(async () => {
    if (!myPhone) return;
    try {
      const { matches, pending } = await loadAddsAndMatches(myPhone);
      setMatches(matches);
      setPending(pending);
    } catch (e) {
      console.error("loadAddsAndMatches failed", e);
    }
  }, [myPhone]);

  useEffect(() => {
    if (session) refresh();
  }, [session, refresh]);

  const startOtp = useCallback(async (digits: string) => {
    const e164 = toE164(digits);
    setPendingPhone(e164);
    await sendOtp(e164);
  }, []);

  const verifyCode = useCallback(async (code: string) => {
    await verifyOtp(pendingPhone, code);
  }, [pendingPhone]);

  const addOne = useCallback(async (digits: string) => {
    const e164 = toE164(digits);
    await addPhones(myPhone, [e164]);
    setLastAddedPhone(formatE164(e164));
    refresh();
  }, [myPhone, refresh]);

  const addMany = useCallback(async (formattedPhones: string[]) => {
    const e164s = formattedPhones.map((p) => toE164(p));
    await addPhones(myPhone, e164s);
    setLastAddedPhone(formatE164(e164s[0]));
    refresh();
  }, [myPhone, refresh]);

  const doSignOut = useCallback(async () => {
    await signOut();
  }, []);

  const value: Ctx = {
    accent, setAccent,
    session, sessionLoading, user,
    myPhone, myPhoneFormatted,
    matches, pending, refresh,
    pendingPhone, startOtp, verifyCode,
    lastAddedPhone, addOne, addMany,
    activeMatch, setActiveMatch,
    doSignOut,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
