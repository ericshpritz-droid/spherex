import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenCode } from "../mutual/screens/Onboarding.jsx";
import { useApp } from "../mutual/AppContext";
import { formatE164 } from "../mutual/auth";

export const Route = createFileRoute("/_app/code")({
  head: () => ({
    meta: [
      { title: "Verify your code — Mutual" },
      { name: "description", content: "Enter the 6-digit code we just texted you." },
      { property: "og:title", content: "Verify your code — Mutual" },
      { property: "og:description", content: "Enter the 6-digit code we just texted you." },
    ],
  }),
  component: CodeRoute,
});

function CodeRoute() {
  const { accent, pendingPhone, verifyCode } = useApp();
  const navigate = useNavigate();
  return (
    <ScreenCode
      accent={accent}
      phoneFormatted={pendingPhone ? formatE164(pendingPhone) : ""}
      onVerify={verifyCode}
      onBack={() => navigate({ to: "/phone" })}
    />
  );
}
