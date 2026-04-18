import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ScreenPhone } from "../mutual/screens/Onboarding.jsx";
import { useApp } from "../mutual/AppContext";
import { useTestMode } from "../mutual/testmode/useTestMode";
import { TestLogin } from "../mutual/testmode/TestLogin";

export const Route = createFileRoute("/_app/phone")({
  head: () => ({
    meta: [
      { title: "Enter your number — Sphere" },
      { name: "description", content: "Sign in with your phone number. We'll text you a 6-digit code." },
      { property: "og:title", content: "Enter your number — Sphere" },
      { property: "og:description", content: "Sign in with your phone number." },
    ],
  }),
  component: PhoneRoute,
});

function PhoneRoute() {
  const { accent, startOtp } = useApp();
  const { enabled: testEnabled } = useTestMode();
  const navigate = useNavigate();
  const [showTest, setShowTest] = useState(false);

  if (showTest) {
    return <TestLogin onCancel={() => setShowTest(false)} />;
  }

  return (
    <div className="relative h-full">
      <ScreenPhone
        accent={accent}
        onSendCode={async (digits: string) => {
          await startOtp(digits);
          navigate({ to: "/code" });
        }}
        onBack={() => navigate({ to: "/welcome" })}
      />
      {testEnabled && (
        <button
          onClick={() => setShowTest(true)}
          className="absolute top-5 right-5 z-50 rounded-full text-[11px] font-semibold uppercase tracking-wide cursor-pointer"
          style={{
            padding: "6px 12px",
            background: "rgba(245,158,11,0.95)",
            color: "white",
            border: 0,
            letterSpacing: 1,
          }}
        >
          Test login
        </button>
      )}
    </div>
  );
}
