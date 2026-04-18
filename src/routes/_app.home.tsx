import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ScreenHome } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";

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
  const { accent, matches, pending, setActiveMatch, dataLoading, dataError, refresh } = useApp();
  const navigate = useNavigate();
  const hasData = matches.length > 0 || pending.length > 0;

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

  return (
    <ScreenHome
      accent={accent}
      matches={matches}
      pending={pending}
      loading={dataLoading && !hasData}
      refreshing={dataLoading && hasData}
      error={dataError}
      onRetry={refresh}
      onOpenMatch={(m: any) => { setActiveMatch(m); navigate({ to: "/match" }); }}
      onAdd={() => navigate({ to: "/add" })}
    />
  );
}
