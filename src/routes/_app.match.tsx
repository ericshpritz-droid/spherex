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
  return (
    <ScreenMatchReveal
      accent={accent}
      match={activeMatch || matches[0]}
      onBack={() => navigate({ to: "/home" })}
      onClose={() => navigate({ to: "/home" })}
    />
  );
}
