import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "../mutual/toast";
import { ScreenProfile } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";
import { useIsAdmin } from "../mutual/testmode/useTestMode";
import { ShareInviteButton } from "../mutual/components/ShareInviteButton";
import { getInviteConversionsServer } from "../mutual/invites.functions";
import { useContactPhotos } from "../mutual/native/useContactPhotos";
import { getContactPhotosEnabled, setContactPhotosEnabled } from "../mutual/native/contactPhotosPref";
import { isNative } from "../mutual/native/platform";
import { haptics } from "../mutual/native/haptics";
import { getHapticsEnabled, setHapticsEnabled } from "../mutual/native/hapticsPref";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Sphere" },
      { name: "description", content: "Manage your accent and account." },
    ],
  }),
  component: ProfileRoute,
});

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}

function ProfileRoute() {
  const { accent, setAccent, myPhoneFormatted, doSignOut, user, session } = useApp();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin(user?.id);
  const testPin: string | undefined = user?.user_metadata?.test_pin;

  const { photos, status, reload } = useContactPhotos();
  const [enabled, setEnabled] = useState<boolean>(() => getContactPhotosEnabled());

  const contactPhotos = useMemo(() => ({
    enabled,
    status,
    count: photos.size,
    onToggle: async (next: boolean) => {
      setContactPhotosEnabled(next);
      setEnabled(next);
      if (next) {
        toast.success("Contact photos on");
      } else {
        toast.success("Contact photos off");
      }
    },
    onRefresh: async () => {
      await reload();
      toast.success("Photos refreshed");
    },
    onOpenSettings: async () => {
      if (!isNative()) {
        toast.message("Available on iOS");
        return;
      }
      try {
        // Deep-link to the Sphere entry of the iOS Settings app, where the
        // user can toggle the Contacts permission.
        window.location.href = "app-settings:";
      } catch {
        toast.error("Could not open Settings");
      }
    },
  }), [enabled, status, photos, reload]);

  const [hapticsOn, setHapticsOn] = useState<boolean>(() => getHapticsEnabled());
  const feel = useMemo(() => ({
    reduced: !hapticsOn,
    onToggleReduced: (nextReduced: boolean) => {
      const nextEnabled = !nextReduced;
      setHapticsEnabled(nextEnabled);
      setHapticsOn(nextEnabled);
      // Fire one tick *after* enabling so the user feels the change; stay
      // silent when muting so we don't contradict their request.
      if (nextEnabled) {
        // Defer so the new pref is read by the haptics module.
        setTimeout(() => haptics.success(), 0);
        toast.success("Haptics on");
      } else {
        toast.message("Haptics off");
      }
    },
  }), [hapticsOn]);

  const fetchConversions = useServerFn(getInviteConversionsServer);
  const [invites, setInvites] = useState<{ count: number; lastAt: string | null }>({ count: 0, lastAt: null });
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetchConversions({ data: undefined as any })
      .then((res: any) => { if (!cancelled) setInvites({ count: res.count ?? 0, lastAt: res.lastAt ?? null }); })
      .catch((e) => console.warn("getInviteConversions failed", e));
    return () => { cancelled = true; };
  }, [session, fetchConversions]);
  return (
    <div className="relative h-full">
      <ScreenProfile
        accent={accent}
        onAccent={setAccent}
        phone={myPhoneFormatted}
        contactPhotos={contactPhotos}
        feel={feel}
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
              haptics.selection();
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
      <div className="absolute left-4 right-4 z-40 flex flex-col items-stretch gap-2" style={{ bottom: 96 }}>
        <ShareInviteButton accent={accent} />
        {invites.count >= 1 && (
          <div
            className="text-center text-[12px] text-white/70"
            style={{ letterSpacing: 0.2 }}
          >
            <span className="font-semibold text-white">
              {invites.count} {invites.count === 1 ? "friend" : "friends"}
            </span>{" "}
            joined via your link
            {invites.lastAt && (
              <span className="text-white/50"> · last {relativeTime(invites.lastAt)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
