import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenMatchReveal } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";

export const Route = createFileRoute("/_app/match")({
  head: () => ({
    meta: [
      { title: "It's mutual — Sphere" },
      { name: "description", content: "You both picked each other." },
    ],
  }),
  component: MatchRoute,
});

function MatchRoute() {
  const { accent, activeMatch, matches } = useApp();
  const navigate = useNavigate();
  const match = activeMatch || matches[0];
  const openThread = () => {
    if (match?.id) navigate({ to: "/thread/$hash", params: { hash: String(match.id) } });
    else navigate({ to: "/home" });
  };
  return (
    <ScreenMatchReveal
      accent={accent}
      match={match}
      onBack={() => navigate({ to: "/home" })}
      onClose={openThread}
    />
  );
}
