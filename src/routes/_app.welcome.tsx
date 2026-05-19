import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, Chip, Eyebrow } from "@/sphere/ui";
import { WelcomeCarousel } from "@/sphere/components/WelcomeCarousel";
import { useTestMode } from "@/mutual/testmode/useTestMode";
import { TestLogin } from "@/mutual/testmode/TestLogin";

export const Route = createFileRoute("/_app/welcome")({
  head: () => ({
    meta: [
      { title: "sphere — There's someone you can't stop thinking about." },
      { name: "description", content: "Anonymous unless mutual. Add their number — if they add yours back, you're in each other's sphere." },
      { property: "og:title", content: "sphere — There's someone you can't stop thinking about." },
      { property: "og:description", content: "Anonymous unless mutual." },
    ],
  }),
  component: WelcomeRoute,
});

const CHIPS = [
  "A classmate", "A co-worker", "A family friend",
  "A neighbor", "An ex you can't shake",
  "Your gym crush", "A friend-of-a-friend",
];

function WelcomeRoute() {
  const navigate = useNavigate();
  const { enabled: testModeEnabled } = useTestMode();
  const [showTestLogin, setShowTestLogin] = useState(false);

  if (showTestLogin) {
    return <TestLogin onCancel={() => setShowTestLogin(false)} />;
  }

  return (
    <SphereScreen>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <div className="font-serif italic text-[22px]">sphere</div>
        <button
          onClick={() => navigate({ to: "/phone" })}
          className="font-sans text-[14px] text-ink/80"
        >
          Sign in
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-4" data-scroll>
        <h1 className="font-serif italic text-[36px] leading-[1.04] tracking-tight">
          There's someone you can't stop thinking about.
        </h1>
        <Eyebrow className="mt-4">But you're too shy to ask them out</Eyebrow>
        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <Chip key={c} as="span">{c}</Chip>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-6 pt-3 shrink-0"
        style={{ paddingBottom: `calc(max(env(safe-area-inset-bottom), 0px) + 1.25rem)` }}
      >
        <PrimaryButton onClick={() => navigate({ to: "/phone" })}>
          Verify your number to start
        </PrimaryButton>
        <div className="mt-4 text-center font-serif italic text-[13px] text-mute">
          Anonymous unless mutual. Always.
        </div>
        <div className="mt-1 text-center font-sans text-[12px] text-mute">
          By continuing you agree to our{" "}
          <a href="/terms" className="underline text-ink/70">Terms</a> and{" "}
          <a href="/privacy" className="underline text-ink/70">Privacy</a>.
        </div>
      </div>

      {testModeEnabled && (
        <button
          onClick={() => setShowTestLogin(true)}
          className="absolute z-[2] rounded-full text-[11px] font-mono uppercase cursor-pointer"
          style={{
            top: 14,
            right: 16,
            padding: "5px 10px",
            border: "1px solid rgba(10,10,10,0.18)",
            background: "rgba(255,255,255,0.6)",
            color: "#0A0A0A",
            letterSpacing: "0.18em",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          Test mode
        </button>
      )}
    </SphereScreen>
  );
}
