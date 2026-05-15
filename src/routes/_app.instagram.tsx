import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, Eyebrow } from "@/sphere/ui";
import { cn } from "@/lib/utils";
import { haptics } from "@/mutual/native/haptics";

export const Route = createFileRoute("/_app/instagram")({
  head: () => ({
    meta: [
      { title: "Add your Instagram — sphere" },
      { name: "description", content: "Optional. Adding your handle doubles your match odds." },
    ],
  }),
  component: InstagramRoute,
});

const HANDLE_KEY = "sphere.igHandleHash";

async function sha256(s: string) {
  if (typeof window === "undefined" || !window.crypto?.subtle) return "";
  const buf = new TextEncoder().encode(s);
  const hash = await window.crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function InstagramRoute() {
  const navigate = useNavigate();
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);

  const cleaned = handle.replace(/^@/, "").trim().toLowerCase();
  const valid = /^[a-z0-9._]{1,30}$/.test(cleaned);

  async function next(connect: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      if (connect && valid) {
        const hash = await sha256(cleaned);
        try { localStorage.setItem(HANDLE_KEY, hash); } catch {}
      }
      navigate({ to: "/onboarding-explainer" as any, replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          aria-label="Back"
          onClick={() => navigate({ to: "/code" })}
          className="font-sans text-[18px] text-ink/80 -ml-1 px-2"
        >
          ←
        </button>
        <div
          className="font-mono text-[11px] uppercase text-mute"
          style={{ letterSpacing: "0.22em" }}
        >
          Step 3 of 3
        </div>
        <button
          onClick={() => { haptics.light(); next(false); }}
          className="font-sans text-[14px] text-ink/80"
        >
          Skip
        </button>
      </div>

      <div className="px-6 pt-5 pb-2 shrink-0" data-scroll>
        <Eyebrow>Optional · you can skip</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[30px] leading-[1.05] tracking-tight">
          Add your Instagram<br />so others can find you.
        </h1>
        <p className="mt-2 text-[14px] text-mute leading-snug">
          Without it, you can only be added by phone number. Most people add their @handle so friends-of-friends can pick them too.
        </p>

        <div className="mt-5">
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl bg-surface border border-line",
              "h-14 px-4",
            )}
          >
            <span className="font-sans text-[17px] text-mute">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="jordan.sims"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="username"
              enterKeyHint="done"
              className="flex-1 bg-transparent font-sans text-[17px] text-ink placeholder:text-mute outline-none border-0"
            />
          </div>
          <p className="mt-3 text-[13px] text-mute leading-snug">
            Hashed on this device. We never post, never DM, and never see your handle in plain text.
          </p>
          {handle && !valid && (
            <div className="mt-2 text-[12px] text-danger">
              Letters, numbers, dots and underscores only.
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0" />

      <div
        className="px-6 pt-3 space-y-2 shrink-0"
        style={{ paddingBottom: `calc(max(env(safe-area-inset-bottom), var(--kb-inset, 0px)) + 1rem)` }}
      >
        <PrimaryButton onClick={() => next(true)} disabled={!valid || busy}>
          {valid ? `Connect @${cleaned}` : "Connect Instagram"}
        </PrimaryButton>
        <div className="text-center text-[12px] text-mute">
          Now both your number and @handle can find a match.
        </div>
        <button
          onClick={() => { haptics.light(); next(false); }}
          disabled={busy}
          className="w-full text-center font-sans text-[14px] text-ink/80 underline py-2"
        >
          Skip · only my number
        </button>
      </div>
    </SphereScreen>
  );
}
