import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  // Bounce immediately to /welcome — the layout handles auth-aware redirects from there
  beforeLoad: () => {
    throw redirect({ to: "/welcome", replace: true });
  },
  component: () => null,
});
