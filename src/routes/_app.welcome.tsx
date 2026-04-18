import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenWelcome } from "../mutual/screens/Onboarding.jsx";
import { useApp } from "../mutual/AppContext";

export const Route = createFileRoute("/_app/welcome")({
  head: () => ({
    meta: [
      { title: "Sphere — Only if they pick you back." },
      { name: "description", content: "Add a number. If they add yours, it's mutual. No DMs. No maybe." },
      { property: "og:title", content: "Sphere — Only if they pick you back." },
      { property: "og:description", content: "Phone-number-based double-opt-in matching." },
    ],
  }),
  component: WelcomeRoute,
});

function WelcomeRoute() {
  const { accent } = useApp();
  const navigate = useNavigate();
  return <ScreenWelcome accent={accent} onNext={() => navigate({ to: "/phone" })}/>;
}
