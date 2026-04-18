import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "../mutual/toast";
import { ScreenProfile } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";
import { useIsAdmin } from "../mutual/testmode/useTestMode";
import { ShareInviteButton } from "../mutual/components/ShareInviteButton";

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
  const testPin: string | undefined = user?.user_metadata?.test_pin;
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
      {testPin && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1 rounded-2xl"
          style={{
            top: 80,
            padding: "10px 18px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
            Your test PIN
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(testPin).then(
                () => toast.success("PIN copied"),
                () => {},
              );
            }}
            className="text-white font-bold tracking-widest cursor-pointer bg-transparent border-0"
            style={{ fontSize: 24, letterSpacing: 6 }}
            title="Tap to copy"
          >
            {testPin}
          </button>
          <div className="text-[10px] text-white/50">Share this so others can add you</div>
        </div>
      )}
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
      <div className="absolute left-4 right-4 z-40" style={{ bottom: 96 }}>
        <ShareInviteButton accent={accent} />
      </div>
    </div>
  );
}
