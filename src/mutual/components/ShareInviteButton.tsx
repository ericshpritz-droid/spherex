import { useEffect, useState } from "react";
import { ACCENT_PRESETS, gradient } from "../brand.js";
import { callGetMyPhoneHash } from "../dataApi.rpc";
import { toast } from "../toast";

type Accent = "pink" | "lavender" | "blue";

/**
 * Share button for the invite link. The link encodes the user's *hashed*
 * phone (server-computed) so we never expose the raw number publicly.
 */
export function ShareInviteButton({ accent, variant = "primary" }: { accent: Accent; variant?: "primary" | "ghost" }) {
  const [hash, setHash] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    callGetMyPhoneHash().then((h) => { if (!cancelled) setHash(h); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const url = hash && typeof window !== "undefined"
    ? `${window.location.origin}/i/${hash}`
    : "";
  const shareText = "I'm on Sphere — add me and we're mutual. ✨";

  const onShare = async () => {
    if (!url) return;
    const nav = typeof navigator !== "undefined" ? navigator : null;
    if (nav && typeof nav.share === "function") {
      try {
        await nav.share({ title: "Sphere", text: shareText, url });
        return;
      } catch {
        // User cancelled or share failed — fall back to copy.
      }
    }
    try {
      await nav?.clipboard?.writeText(`${shareText} ${url}`);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  if (variant === "ghost") {
    return (
      <button
        onClick={onShare}
        disabled={!url}
        className="rounded-[14px] border border-hairline-10 bg-glass-08 text-white text-[14px] font-semibold cursor-pointer w-full"
        style={{ padding: "12px 14px", opacity: url ? 1 : 0.5 }}
      >
        🔗 Share invite link
      </button>
    );
  }

  return (
    <button
      onClick={onShare}
      disabled={!url}
      className="rounded-[16px] text-white font-semibold cursor-pointer w-full"
      style={{
        padding: "14px 16px",
        background: gradient(accent, "135deg"),
        boxShadow: `0 10px 28px ${ACCENT_PRESETS[accent].a}40`,
        opacity: url ? 1 : 0.5,
        fontSize: 15,
      }}
    >
      ✨ Invite friends
    </button>
  );
}
