import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApp } from "../mutual/AppContext";
import { ScreenContacts } from "../mutual/screens/Main.jsx";
import { toast } from "../mutual/toast";
import { Button } from "../mutual/components/Button.jsx";
import { Aura } from "../mutual/components/index.jsx";

export const Route = createFileRoute("/_app/onboarding-import")({
  head: () => ({
    meta: [
      { title: "Import contacts — Sphere" },
      { name: "description", content: "Add a few people to start finding mutuals." },
    ],
  }),
  component: OnboardingImportRoute,
});

function markOnboarded(uid: string | undefined) {
  if (typeof window === "undefined" || !uid) return;
  try { localStorage.setItem(`mutual.onboarded.${uid}`, "1"); } catch {}
}

function OnboardingImportRoute() {
  const { accent, addMany, user } = useApp();
  const navigate = useNavigate();

  const skip = () => {
    markOnboarded(user?.id);
    navigate({ to: "/home", replace: true });
  };

  return (
    <div className="relative h-full">
      <ScreenContacts
        accent={accent}
        onBack={skip}
        onPick={async (phones: string[]) => {
          try {
            await addMany(phones);
            markOnboarded(user?.id);
            toast.success(`Added ${phones.length}. Anyone who picks you back lights up.`);
            navigate({ to: "/home", replace: true });
          } catch (e: any) {
            toast.error(e?.message || "Could not add contacts");
          }
        }}
      />
      {/* Skip pill — overlays back chevron context. */}
      <button
        onClick={skip}
        className="absolute top-5 right-5 z-50 rounded-full text-[12px] font-semibold cursor-pointer"
        style={{
          padding: "8px 14px",
          background: "rgba(255,255,255,0.10)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        Skip
      </button>
    </div>
  );
}

// Re-export the helper for AppContext / _app.tsx so they stay in sync.
export const ONBOARDED_KEY_PREFIX = "mutual.onboarded.";
