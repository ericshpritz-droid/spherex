import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "../mutual/toast";
import { ScreenProfile } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";
import { useIsAdmin } from "../mutual/testmode/useTestMode";

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
  const { accent, setAccent, myPhoneFormatted, doSignOut, user } = useApp();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin(user?.id);
  return (
    <div className="relative h-full">
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
      {isAdmin && (
        <button
          onClick={() => navigate({ to: "/admin" })}
          className="absolute top-5 right-5 z-50 rounded-full text-[11px] font-semibold uppercase tracking-wide cursor-pointer"
          style={{
            padding: "6px 12px",
            background: "rgba(255,255,255,0.12)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.2)",
            letterSpacing: 1,
          }}
        >
          Admin
        </button>
      )}
    </div>
  );
}
