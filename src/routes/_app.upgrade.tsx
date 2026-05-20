import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";

export const Route = createFileRoute("/_app/upgrade")({
  head: () => ({
    meta: [
      { title: "Sphere+ — sphere" },
      { name: "description", content: "Three sealed picks at a time." },
    ],
  }),
  component: UpgradeRoute,
});

// Upgrade lives as a bottom sheet on /home now. This route just redirects.
function UpgradeRoute() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/home" as any, replace: true });
  }, [navigate]);
  return <SphereScreen dark>{null}</SphereScreen>;
}
