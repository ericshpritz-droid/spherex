import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, GhostButton, Eyebrow } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
import { toast } from "@/mutual/toast";

export const Route = createFileRoute("/_app/profile/invite")({
  head: () => ({
    meta: [
      { title: "Invite — sphere" },
      { name: "description", content: "Share your sphere link." },
    ],
  }),
  component: InviteRoute,
});

function InviteRoute() {
  const navigate = useNavigate();
  const { myHash } = useApp();
  const [link, setLink] = useState("");

  useEffect(() => {
    if (!myHash) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://mysphere.love";
    setLink(`${origin}/i/${myHash.slice(0, 12)}`);
  }, [myHash]);

  async function share() {
    if (!link) return;
    const text = "I'm on sphere — anonymous picks, only mutual ignites.";
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "sphere", text, url: link });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(link);
      toast("Link copied");
    } catch {
      toast("Copy not supported");
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast("Link copied");
    } catch {
      toast("Copy not supported");
    }
  }

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          onClick={() => navigate({ to: "/profile" as any })}
          className="text-ink/80 text-[18px] -ml-1 px-2"
          aria-label="Back"
        >
          ←
        </button>
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4" data-scroll>
        <Eyebrow>Sphere works better with them on it</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[36px] leading-[1.04] tracking-tight">
          Know someone you'd pick? Tell them.
        </h1>
        <p className="mt-4 text-[14px] text-mute leading-relaxed">
          Sphere only matches when both sides are here. Sharing your link is the
          simplest way to make your sphere actually work — they'll get a private
          invite, nothing about who you picked.
        </p>

        <div className="mt-7 rounded-2xl bg-[#EFECE5] p-5">
          <div
            className="font-mono text-[10px] uppercase text-mute"
            style={{ letterSpacing: "0.22em" }}
          >
            Your link
          </div>
          <div className="mt-3 font-mono text-[13px] break-all text-ink">
            {link || "—"}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3">
        <PrimaryButton onClick={share} disabled={!link}>
          Share link
        </PrimaryButton>
        <GhostButton onClick={copy} disabled={!link}>
          Copy
        </GhostButton>
      </div>
    </SphereScreen>
  );
}
