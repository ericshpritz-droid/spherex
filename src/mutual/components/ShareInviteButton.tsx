import { useEffect, useState } from "react";
import { callGetMyPhoneHash } from "../dataApi.rpc";
import { toast } from "../toast";

/**
 * Share button for the invite link. The link encodes the user's *hashed*
 * phone (server-computed) so we never expose the raw number publicly.
 */
export function ShareInviteButton({ variant = "primary" }: { variant?: "primary" | "ghost" }) {
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
        className="w-full rounded-2xl border border-line bg-transparent text-ink text-[14px] font-medium cursor-pointer"
        style={{ padding: "12px 14px", opacity: url ? 1 : 0.5 }}
      >
        Share invite link
      </button>
    );
  }

  return (
    <button
      onClick={onShare}
      disabled={!url}
      className="w-full rounded-full bg-ink text-paper font-semibold cursor-pointer border-0"
      style={{
        padding: "14px 16px",
        opacity: url ? 1 : 0.5,
        fontSize: 15,
        letterSpacing: 0.2,
      }}
    >
      Invite friends →
    </button>
  );
}
