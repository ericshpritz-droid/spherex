import { createFileRoute, useNavigate } from "@tanstack/react-router";
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

function HomeRoute() {
  const { accent, matches, pending, setActiveMatch, dataLoading, dataError, refresh } = useApp();
  const navigate = useNavigate();
  return (
    <ScreenHome
      accent={accent}
      matches={matches}
      pending={pending}
      loading={dataLoading && matches.length === 0 && pending.length === 0}
      error={dataError}
      onRetry={refresh}
      onOpenMatch={(m: any) => { setActiveMatch(m); navigate({ to: "/match" }); }}
      onAdd={() => navigate({ to: "/add" })}
    />
  );
}
