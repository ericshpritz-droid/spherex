import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppProvider, useApp } from "../mutual/AppContext";
import { Spinner } from "../mutual/components/Spinner.jsx";
import { isNative, nativePlatform } from "../mutual/native/platform";
import { useKeyboardInset } from "@/sphere/native/useKeyboardInset";
import { useRouteDirection } from "@/sphere/native/useRouteDirection";
import { useEdgeSwipeBack } from "@/sphere/native/useEdgeSwipeBack";
import { ThemeToggle } from "@/sphere/ui/ThemeToggle";
import { useTestMode } from "@/mutual/testmode/useTestMode";

function TestModeIndicator() {
  const { enabled } = useTestMode();
  if (!enabled) return null;
  return (
    <div
      className="absolute z-50 pointer-events-none flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white shadow-sm"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 12px)",
        left: 12,
        background: "#F97316",
      }}
    >
      <span className="size-1.5 rounded-full bg-white" />
      Test
    </div>
  );
}

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
  const { session, sessionLoading, accent, user } = useApp();
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
      // New users go through the Sphere onboarding (instagram → explainer).
      // Existing users land on /home directly.
      const dest = !onboarded ? "/instagram" : "/home";
      queueMicrotask(() => navigate({ to: dest, replace: true }));
    }
  }

  // Detect "phone-sized" viewport so the faux phone-frame ONLY shows on
  // desktop preview. On any mobile-sized viewport — real native shell, the
  // iframe preview at mobile sizes, or a real iPhone Safari — fill the screen.
  // Only the real native iOS shell or a viewport too small to fit the
  // 402×874 phone frame goes full-bleed. Everything else (desktop, tablet,
  // and large mobile browsers) renders inside the iPhone-shaped frame so
  // the web app always feels like the app.
  const native = isNative();
  const [tooSmallForFrame, setTooSmallForFrame] = useState(() => {
    if (typeof window === "undefined") return false;
    // Frame needs ~402×600 minimum to look right; below that, fill the screen.
    return window.innerWidth < 440 || window.innerHeight < 620;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => {
      setTooSmallForFrame(window.innerWidth < 440 || window.innerHeight < 620);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const fullBleed = native || tooSmallForFrame;

  const wrapperClass = fullBleed
    ? "h-[100dvh] w-screen bg-black"
    : "min-h-screen bg-frame flex justify-center items-center";
  const wrapperStyle: React.CSSProperties = fullBleed ? {} : { padding: "20px 0" };
  const innerClass = fullBleed
    ? "h-full w-full overflow-hidden relative bg-black"
    : "overflow-hidden relative bg-black";
  const innerStyle: React.CSSProperties = fullBleed
    ? {}
    : {
        width: "min(402px, 100vw)", height: "min(874px, 100vh)",
        maxWidth: 402, maxHeight: 874,
        borderRadius: 48,
        boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
      };

  return (
    <div className={wrapperClass} style={wrapperStyle}>
      <div className={innerClass} style={innerStyle}>
        {showShellLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white bg-ink">
            <Spinner accent={accent} size={36}/>
            <div className="text-sm text-fg-60">Loading…</div>
          </div>
        ) : (
          <RouteStack>
            <Outlet />
          </RouteStack>
        )}
        {/* Test-mode indicator — small orange pill, top-left */}
        <TestModeIndicator />
        {/* Floating theme toggle — visible on every screen, sits above route content */}
        <div
          className="absolute z-50 pointer-events-auto"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 10px)", right: 12 }}
        >
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

/**
 * iOS-style page stack: animates push/pop transitions on route change and
 * supports edge-swipe-back. Renders the previous route alongside the new one
 * during the transition window so the animation can cross-fade them.
 */
function RouteStack({ children }: { children: React.ReactNode }) {
  useKeyboardInset();
  const { dir, key } = useRouteDirection();
  const swipeRef = useEdgeSwipeBack(true);
  const [layers, setLayers] = useState<{ key: string; node: React.ReactNode; phase: "enter" | "stay" | "exit" }[]>(
    () => [{ key, node: children, phase: "stay" }],
  );
  const prevKey = useRef(key);

  useEffect(() => {
    if (prevKey.current === key) {
      // Same key, just refresh the node
      setLayers((curr) => curr.map((l) => (l.key === key ? { ...l, node: children } : l)));
      return;
    }
    prevKey.current = key;
    setLayers((curr) => {
      const exiting = curr.map((l) => ({ ...l, phase: "exit" as const }));
      return [...exiting, { key, node: children, phase: "enter" as const }];
    });
    const t = window.setTimeout(() => {
      setLayers((curr) => curr.filter((l) => l.key === key).map((l) => ({ ...l, phase: "stay" as const })));
    }, 360);
    return () => window.clearTimeout(t);
  }, [key, children]);

  return (
    <div ref={swipeRef} className="ios-stack" data-dir={dir}>
      {layers.map((l) => (
        <div
          key={l.key}
          data-route
          className={l.phase === "enter" ? "is-enter" : l.phase === "exit" ? "is-exit" : ""}
        >
          {l.node}
        </div>
      ))}
    </div>
  );
}
