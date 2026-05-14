import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, GhostButton, Eyebrow } from "@/sphere/ui";
import { cn } from "@/lib/utils";

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
        <div className="w-6" />
        <div className="font-serif italic text-[18px]">sphere</div>
        <button
          onClick={() => next(false)}
          className="font-sans text-[14px] text-ink/80"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-10 pb-4" data-scroll>
        <Eyebrow>Optional</Eyebrow>
        <h1 className="mt-3 font-serif italic text-[40px] leading-[1.02] tracking-tight">
          Add your Instagram.
        </h1>
        <p className="mt-3 text-[14px] text-mute leading-snug">
          A second way for someone to find you anonymously. Hashed on device, never shown.
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink text-paper px-3 h-7 text-[11px] font-mono uppercase"
          style={{ letterSpacing: "0.16em" }}
        >
          + 2× match odds
        </div>

        <div className="mt-8">
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl bg-white border border-line",
              "h-16 px-4",
            )}
          >
            <span className="font-sans text-[17px] text-mute">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="yourhandle"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 bg-transparent font-sans text-[17px] text-ink placeholder:text-mute outline-none border-0"
            />
          </div>
          {handle && !valid && (
            <div className="mt-2 text-[12px] text-danger">
              Letters, numbers, dots and underscores only.
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3">
        <PrimaryButton onClick={() => next(true)} disabled={!valid || busy}>
          {valid ? `Connect @${cleaned}` : "Connect Instagram"}
        </PrimaryButton>
        <GhostButton onClick={() => next(false)} disabled={busy}>
          Skip · only my number
        </GhostButton>
      </div>
    </SphereScreen>
  );
}
