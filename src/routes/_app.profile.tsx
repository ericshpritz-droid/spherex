import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenProfile } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Mutual" },
      { name: "description", content: "Manage your accent and account." },
    ],
  }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const { accent, setAccent, myPhoneFormatted, doSignOut } = useApp();
  const navigate = useNavigate();
  return (
    <ScreenProfile
      accent={accent}
      onAccent={setAccent}
      phone={myPhoneFormatted}
      onSignOut={async () => { await doSignOut(); navigate({ to: "/welcome" }); }}
    />
  );
}
