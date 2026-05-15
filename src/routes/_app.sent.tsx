import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, Eyebrow } from "@/sphere/ui";
import { useApp } from "../mutual/AppContext";

export const Route = createFileRoute("/_app/sent")({
  head: () => ({
    meta: [
      { title: "Added — sphere" },
      { name: "description", content: "Now we wait. If they add you, it's mutual." },
    ],
  }),
  component: SentRoute,
});

function SentRoute() {
  const { lastAddedPhone, refresh } = useApp();
  const navigate = useNavigate();
  const last4 = String(lastAddedPhone || "").replace(/\D/g, "").slice(-4);

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Quiet emblem — paper circle with last 4 digits */}
        <div
          className="rounded-full border border-line bg-surface flex items-center justify-center mb-8"
          style={{ width: 132, height: 132 }}
        >
          <div className="font-serif italic text-[28px] text-ink/80 tabular-nums">
            {last4 || "••••"}
          </div>
        </div>

        <Eyebrow>Sealed</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[34px] leading-[1.05] tracking-tight">
          Added.<br />Now we wait.
        </h1>
        <p className="mt-4 max-w-[300px] text-[14px] text-mute leading-snug">
          If they add your number, you’ll both get the notification.
          Until then — total silence.
        </p>
      </div>

      <div
        className="px-6"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 24px)` }}
      >
        <PrimaryButton onClick={() => { refresh(); navigate({ to: "/home" }); }}>
          Okay
        </PrimaryButton>
      </div>
    </SphereScreen>
  );
}
