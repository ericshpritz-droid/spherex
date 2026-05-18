import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "../mutual/toast";
import { SphereProfile } from "@/sphere/screens/SphereProfile";

import { Eyebrow } from "@/sphere/ui";

function SectionLike({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-7">
      <div className="px-2 pb-2"><Eyebrow>{title}</Eyebrow></div>
      <div className="rounded-2xl bg-surface border border-line overflow-hidden">{children}</div>
    </div>
  );
}
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
  const { myPhoneFormatted, doSignOut, user, session } = useApp();
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
    const accessToken = session?.access_token;
    if (!accessToken) return;
    let cancelled = false;
    fetchConversions({ data: undefined as any, headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res: any) => { if (!cancelled) setInvites({ count: res.count ?? 0, lastAt: res.lastAt ?? null }); })
      .catch((e) => console.warn("getInviteConversions failed", e));
    return () => { cancelled = true; };
  }, [session?.access_token, fetchConversions]);

  // Test PIN — laid out as a profile section so it sits flush in the page
  // rhythm rather than floating over the layout.
  const testPinSlot = testPin ? (
    <SectionLike title="Test PIN">
      <div className="px-4 py-5 flex flex-col items-center text-center">
        <button
          onClick={() => {
            haptics.selection();
            navigator.clipboard?.writeText(testPin).then(
              () => toast.success("PIN copied"),
              () => {},
            );
          }}
          className="font-serif italic text-ink bg-transparent border-0 cursor-pointer leading-none"
          style={{ fontSize: 40, letterSpacing: 8 }}
          title="Tap to copy"
        >
          {testPin}
        </button>
        <div className="mt-3 text-[12px] text-mute">
          Tap to copy. Share this so others can add you.
        </div>
        <button
          onClick={() => navigate({ to: "/test-share" })}
          className="mt-4 rounded-full text-[12px] font-semibold cursor-pointer bg-ink text-paper border-0"
          style={{ padding: "8px 16px" }}
        >
          One-time share code →
        </button>
      </div>
    </SectionLike>
  ) : null;

  const inviteSlot = (
    <SectionLike title="Invite">
      <div className="p-4 flex flex-col items-stretch gap-3">
        <ShareInviteButton />
        {invites.count >= 1 && (
          <div className="text-center text-[12px] text-mute">
            <span className="font-semibold text-ink">
              {invites.count} {invites.count === 1 ? "friend" : "friends"}
            </span>{" "}
            joined via your link
            {invites.lastAt && (
              <span className="text-mute"> · last {relativeTime(invites.lastAt)}</span>
            )}
          </div>
        )}
      </div>
    </SectionLike>
  );

  const introSlot = (
    <SectionLike title="Intro">
      <button
        onClick={() => {
          haptics.selection();
          navigate({ to: "/onboarding-explainer", search: { rewatch: true } as any });
        }}
        className="w-full text-left flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer hover:bg-ink/[0.03] bg-transparent border-0"
      >
        <span className="text-[15px] font-medium text-ink">Watch intro again</span>
        <span className="text-[14px] text-mute">▶</span>
      </button>
    </SectionLike>
  );

  return (
    <div className="relative h-full">
      <SphereProfile
        phone={myPhoneFormatted}
        contactPhotos={contactPhotos}
        feel={feel}
        topSlot={testPinSlot}
        bottomSlot={<>{inviteSlot}{introSlot}</>}
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
          className="absolute z-50 rounded-full text-[11px] font-semibold uppercase tracking-wide cursor-pointer bg-ink text-paper border-0"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 12px)",
            left: 12,
            padding: "6px 12px",
            letterSpacing: 1,
          }}
        >
          Admin
        </button>
      )}
      
    </div>
  );
}
