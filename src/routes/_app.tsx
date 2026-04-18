import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { AppProvider, useApp } from "../mutual/AppContext";
import { TabBar } from "../mutual/components/index.jsx";
import { Spinner } from "../mutual/components/Spinner.jsx";
import { TestModeBanner } from "../mutual/testmode/TestModeBanner";

const PUBLIC_PATHS = new Set(["/welcome", "/phone", "/code"]);

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
  const { session, sessionLoading, accent } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const isPublic = PUBLIC_PATHS.has(path);

  // Auth-aware redirects (client-side; SSR-safe because we wait for sessionLoading)
  if (!sessionLoading) {
    if (!session && !isPublic && path !== "/") {
      // Bounce to welcome
      queueMicrotask(() => navigate({ to: "/welcome", replace: true }));
    } else if (session && (isPublic || path === "/")) {
      queueMicrotask(() => navigate({ to: "/home", replace: true }));
    }
  }

  // Tab bar visible on the main 3 sections
  const tabPath: "home" | "add" | "me" | null =
    path === "/home" ? "home" :
    path === "/add" ? "add" :
    path === "/profile" ? "me" :
    null;

  const goTab = (t: "home" | "add" | "me") => {
    if (t === "home") navigate({ to: "/home" });
    else if (t === "add") navigate({ to: "/add" });
    else navigate({ to: "/profile" });
  };

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
        {sessionLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white bg-ink">
            <Spinner accent={accent} size={36}/>
            <div className="text-sm text-fg-60">Loading…</div>
          </div>
        ) : (
          <Outlet />
        )}
        {tabPath && <TabBar tab={tabPath} setTab={goTab} accent={accent}/>}
      </div>
    </div>
  );
}
