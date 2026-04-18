import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenSent } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";

export const Route = createFileRoute("/_app/sent")({
  head: () => ({
    meta: [
      { title: "Added — Mutual" },
      { name: "description", content: "Now we wait. If they add you, it's mutual." },
    ],
  }),
  component: SentRoute,
});

function SentRoute() {
  const { accent, lastAddedPhone, refresh } = useApp();
  const navigate = useNavigate();
  return (
    <ScreenSent
      accent={accent}
      phone={lastAddedPhone}
      onDone={() => { refresh(); navigate({ to: "/home" }); }}
    />
  );
}
