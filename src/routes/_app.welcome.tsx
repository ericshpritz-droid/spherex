import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ScreenWelcome } from "../mutual/screens/Onboarding.jsx";
import { useApp } from "../mutual/AppContext";
import { useTestMode } from "../mutual/testmode/useTestMode";
import { TestLogin } from "../mutual/testmode/TestLogin";

export const Route = createFileRoute("/_app/welcome")({
  head: () => ({
    meta: [
      { title: "Sphere — Your sphere starts with one number." },
      { name: "description", content: "Add a number. If they add yours back, you're in each other's sphere." },
      { property: "og:title", content: "Sphere — Your sphere starts with one number." },
      { property: "og:description", content: "Add a number. If they add yours back, you're in each other's sphere." },
    ],
  }),
  component: WelcomeRoute,
});

function WelcomeRoute() {
  const { accent } = useApp();
  const navigate = useNavigate();
  const { enabled: testModeEnabled } = useTestMode();
  const [showTestLogin, setShowTestLogin] = useState(false);

  if (showTestLogin) {
    return <TestLogin onCancel={() => setShowTestLogin(false)} />;
  }

  return (
    <div className="relative h-full">
      <ScreenWelcome accent={accent} onNext={() => navigate({ to: "/phone" })} />
      {testModeEnabled && (
        <button
          onClick={() => setShowTestLogin(true)}
          className="absolute z-[2] rounded-full text-[12px] font-semibold tracking-wide cursor-pointer"
          style={{
            top: 36,
            right: 16,
            padding: "6px 12px",
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.10)",
            color: "white",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          🧪 Test mode
        </button>
      )}
    </div>
  );
}
