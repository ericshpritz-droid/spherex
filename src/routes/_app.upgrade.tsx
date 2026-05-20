import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, GhostButton, Eyebrow } from "@/sphere/ui";
import { toast } from "@/mutual/toast";

export const Route = createFileRoute("/_app/upgrade")({
  head: () => ({
    meta: [
      { title: "Sphere+ — sphere" },
      { name: "description", content: "Three picks at a time. Cancel anytime." },
    ],
  }),
  component: UpgradeRoute,
});

function UpgradeRoute() {
  const navigate = useNavigate();

  function checkout() {
    toast("Checkout opens once Stripe is wired.");
  }

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          onClick={() => navigate({ to: "/home" as any })}
          className="text-ink/80 text-[18px] -ml-1 px-2"
          aria-label="Back"
        >
          ←
        </button>
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4" data-scroll>
        <Eyebrow>Sphere+</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[44px] leading-[1.02] tracking-tight">
          Three at a time.
        </h1>
        <p className="mt-4 text-[15px] text-mute leading-relaxed">
          Free is one quiet pick. Sphere+ unlocks a small constellation —
          three sealed picks, more shots at mutual.
        </p>

        <div className="mt-8 rounded-2xl bg-surface border border-line p-6">
          <div className="flex items-baseline gap-2">
            <div className="font-serif italic text-[40px] leading-none">$9.99</div>
            <div className="text-[13px] text-mute">/ month</div>
          </div>
          <ul className="mt-5 space-y-3 text-[14px] text-ink/80">
            <Bullet>Three picks instead of one</Bullet>
            <Bullet>Send up to three compliments at a time</Bullet>
            <Bullet>Priority match notifications</Bullet>
            <Bullet>Cancel anytime, keep the matches</Bullet>
          </ul>
        </div>

        <p className="mt-6 text-[12px] text-mute leading-relaxed">
          Billed monthly. Auto-renews. You'll always know before the next charge.
          We'll never sell or share your data.
        </p>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3">
        <PrimaryButton onClick={checkout}>Upgrade for $9.99 / month</PrimaryButton>
        <GhostButton onClick={() => navigate({ to: "/home" as any })}>
          Maybe later
        </GhostButton>
      </div>
    </SphereScreen>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[7px] inline-block h-1.5 w-1.5 rounded-full bg-ink" />
      <span>{children}</span>
    </li>
  );
}
