// Admin panel — toggle test mode. DELETE THIS FILE TO REMOVE.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { useApp } from "../mutual/AppContext";
import { setTestMode as setTestModeServer } from "../mutual/testmode/testmode.functions";
import { useIsAdmin } from "../mutual/testmode/useTestMode";
import { Spinner } from "../mutual/components/Spinner.jsx";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — Sphere" }] }),
  component: AdminRoute,
});

function AdminRoute() {
  const { user, accent } = useApp();
  const isAdmin = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const [testMode, setTestModeState] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const updateTestMode = useServerFn(setTestModeServer);

  useEffect(() => {
    supabase.from("app_settings").select("test_mode").eq("id", 1).single()
      .then(({ data }) => setTestModeState(!!data?.test_mode));
  }, []);

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-ink text-white">
        <div className="text-fg-60">Sign in first.</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-ink text-white gap-3" style={{ padding: 24 }}>
        <div className="text-2xl font-bold">Not authorized</div>
        <div className="text-fg-60 text-center text-sm">This page is for admins only.</div>
        <button
          onClick={() => navigate({ to: "/home" })}
          className="mt-4 rounded-[14px] bg-white text-black font-semibold"
          style={{ padding: "12px 18px", border: 0, cursor: "pointer" }}
        >Go home</button>
      </div>
    );
  }

  const toggle = async () => {
    if (testMode === null) return;
    setBusy(true); setErr("");
    const next = !testMode;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Your session expired. Please sign in again.");
      const result = await updateTestMode({
        data: { enabled: next },
        headers: { Authorization: `Bearer ${token}` },
      });
      setTestModeState(result.testMode);
    } catch (error: any) {
      setErr(error?.message || "Could not update test mode");
    }
    setBusy(false);
  };

  return (
    <div className="h-full bg-ink text-white overflow-y-auto" style={{ padding: "72px 28px 40px" }}>
      <button
        onClick={() => navigate({ to: "/profile" })}
        className="w-11 h-11 rounded-full border-0 bg-glass-08 text-white text-xl cursor-pointer mb-6"
      >←</button>
      <div className="font-bold tracking-sora-display" style={{ fontSize: 30 }}>Admin</div>
      <div className="mt-1 text-[13px] text-fg-60">Internal controls.</div>

      <div className="mt-8 rounded-[18px] bg-glass-06 border border-hairline-12" style={{ padding: 18 }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-[15px] font-semibold">Test mode</div>
            <div className="text-[13px] text-fg-60 mt-1">
              When ON, anyone can sign in with a 4-digit PIN + 6-digit code instead of SMS. Turn this OFF before launch.
            </div>
          </div>
          {testMode === null ? (
            <Spinner accent={accent} size={22}/>
          ) : (
            <button
              onClick={toggle}
              disabled={busy}
              className="rounded-full"
              style={{
                width: 56, height: 32,
                background: testMode ? "#22c55e" : "rgba(255,255,255,0.18)",
                border: 0, cursor: "pointer", position: "relative",
                transition: "background 200ms",
              }}
              aria-pressed={testMode}
            >
              <span
                style={{
                  position: "absolute", top: 3,
                  left: testMode ? 27 : 3,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "white",
                  transition: "left 200ms",
                }}
              />
            </button>
          )}
        </div>
        {err && <div className="mt-3 text-[13px] text-error">{err}</div>}
        <div className="mt-3 text-[12px] text-fg-45">
          Status: <span className="text-white font-semibold">{testMode === null ? "loading…" : testMode ? "ON" : "OFF"}</span>
        </div>
      </div>
    </div>
  );
}
