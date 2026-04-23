import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { AppProvider, useApp } from "../mutual/AppContext";
import { Spinner } from "../mutual/components/Spinner.jsx";
import { TestModeBanner } from "../mutual/testmode/TestModeBanner";

const PUBLIC_PATHS = new Set(["/welcome", "/phone", "/code"]);
const ONBOARDED_KEY = (uid: string) => `mutual.onboarded.${uid}`;

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppProvider>
      <PhoneFrame />
    </AppProvider>
  );
}

function PhoneFrame() {
  const { session, sessionLoading, accent, user, matches, pending, dataLoading } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const isPublic = PUBLIC_PATHS.has(path);
  const showShellLoading = sessionLoading && !isPublic;

  // Auth-aware redirects (client-side; SSR-safe because we wait for sessionLoading)
  if (!sessionLoading) {
    if (!session && !isPublic && path !== "/") {
      queueMicrotask(() => navigate({ to: "/welcome", replace: true }));
    } else if (session && (isPublic || path === "/")) {
      const uid = user?.id;
      const onboarded = typeof window !== "undefined" && uid
        ? !!localStorage.getItem(ONBOARDED_KEY(uid))
        : true;
      const empty = !dataLoading && matches.length === 0 && pending.length === 0;
      const dest = !onboarded && empty ? "/onboarding-import" : "/home";
      queueMicrotask(() => navigate({ to: dest, replace: true }));
    }
  }

  return (
    <div className="min-h-screen bg-frame flex justify-center items-center" style={{ padding: "20px 0" }}>
      <TestModeBanner />
      <div
        className="overflow-hidden relative bg-black"
        style={{
          width: "min(402px, 100vw)", height: "min(874px, 100vh)",
          maxWidth: 402, maxHeight: 874,
          borderRadius: 48,
          boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
        }}
      >
        {showShellLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white bg-ink">
            <Spinner accent={accent} size={36}/>
            <div className="text-sm text-fg-60">Loading…</div>
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}
