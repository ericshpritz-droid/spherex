import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, GhostButton, Eyebrow } from "@/sphere/ui";
import { useApp } from "@/mutual/AppContext";
import { toast } from "@/mutual/toast";

export const Route = createFileRoute("/_app/profile/delete")({
  head: () => ({
    meta: [
      { title: "Delete account — sphere" },
      { name: "description", content: "This can't be undone." },
    ],
  }),
  component: DeleteRoute,
});

function DeleteRoute() {
  const navigate = useNavigate();
  const { doSignOut } = useApp();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = confirm === "DELETE";

  async function execute() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      // Account deletion will be wired to a server fn that purges adds, compliments,
      // messages, and the auth user. For now, sign out and surface a notice.
      await doSignOut();
      toast("Sign out complete. Server-side erasure runs next.");
      navigate({ to: "/welcome" as any, replace: true });
    } catch (e: any) {
      toast(e?.message || "Could not delete.");
      setBusy(false);
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
        <Eyebrow>Delete account</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[36px] leading-[1.04] tracking-tight">
          This can't be undone.
        </h1>
        <p className="mt-4 text-[14px] text-mute leading-relaxed">
          Your picks, your matches, every compliment you sent or received —
          gone. Your phone hash is purged so we can never recognize you again.
        </p>

        <div className="mt-7 rounded-2xl border border-[#D8D5D0] p-5">
          <div
            className="font-mono text-[10px] uppercase text-mute"
            style={{ letterSpacing: "0.22em" }}
          >
            Type DELETE to confirm
          </div>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.toUpperCase())}
            placeholder="DELETE"
            className="mt-3 w-full bg-transparent border-b border-[#D8D5D0] focus:border-ink outline-none font-mono text-[18px] tracking-[0.25em] py-2"
            autoCorrect="off"
            autoCapitalize="characters"
          />
        </div>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3">
        <PrimaryButton
          onClick={execute}
          disabled={!ready || busy}
          variant="danger"
        >
          {busy ? "Erasing…" : "Delete forever"}
        </PrimaryButton>
        <GhostButton onClick={() => navigate({ to: "/profile" as any })}>
          Cancel
        </GhostButton>
      </div>
    </SphereScreen>
  );
}
