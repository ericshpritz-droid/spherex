import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenPhone } from "../mutual/screens/Onboarding.jsx";
import { useApp } from "../mutual/AppContext";

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
  const { accent, pendingOtpDelivery, startOtp } = useApp();
  const navigate = useNavigate();

  return (
    <ScreenPhone
      accent={accent}
      deliveryMode={pendingOtpDelivery.mode}
      deliveryStatus={pendingOtpDelivery.status}
      resendCooldownSeconds={30}
      onSendCode={async (digits: string) => {
        await startOtp(digits);
        navigate({ to: "/code" });
      }}
      onBack={() => navigate({ to: "/welcome" })}
    />
  );
}
