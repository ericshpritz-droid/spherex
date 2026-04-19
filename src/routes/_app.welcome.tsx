import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenWelcome } from "../mutual/screens/Onboarding.jsx";
import { useApp } from "../mutual/AppContext";

export const Route = createFileRoute("/_app/welcome")({
  head: () => ({
    meta: [
      { title: "Sphere — Your sphere starts with one number." },
      { name: "description", content: "Add a number. If they add yours back, you're in each other's sphere." },
      { property: "og:title", content: "Sphere — Your sphere starts with one number." },
      { property: "og:description", content: "Add a number. If they add yours back, you're in each other's sphere." },
    ],
  }),
  component: WelcomeRoute,
});

function WelcomeRoute() {
  const { accent } = useApp();
  const navigate = useNavigate();
  return <ScreenWelcome accent={accent} onNext={() => navigate({ to: "/phone" })}/>;
}
