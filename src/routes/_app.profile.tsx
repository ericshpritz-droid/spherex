import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ScreenProfile } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Sphere" },
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
      onSignOut={async () => {
        try {
          await doSignOut();
          toast.success("Signed out");
          navigate({ to: "/welcome" });
        } catch (e: any) {
          toast.error(e?.message || "Could not sign out");
        }
      }}
    />
  );
}
