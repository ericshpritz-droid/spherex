import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenHome } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Your mutuals — Mutual" },
      { name: "description", content: "See who picked you back." },
      { property: "og:title", content: "Your mutuals — Mutual" },
      { property: "og:description", content: "See who picked you back." },
    ],
  }),
  component: HomeRoute,
});

function HomeRoute() {
  const { accent, matches, pending, setActiveMatch } = useApp();
  const navigate = useNavigate();
  return (
    <ScreenHome
      accent={accent}
      matches={matches}
      pending={pending}
      onOpenMatch={(m: any) => { setActiveMatch(m); navigate({ to: "/match" }); }}
      onAdd={() => navigate({ to: "/add" })}
    />
  );
}
