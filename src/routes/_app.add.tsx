import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "../mutual/toast";
import { ScreenAdd } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";
import { useTestMode } from "../mutual/testmode/useTestMode";
import { testmodeResolvePin } from "../mutual/testmode/testmode.functions";

export const Route = createFileRoute("/_app/add")({
  head: () => ({
    meta: [
      { title: "Add a number — Sphere" },
      { name: "description", content: "Add someone's number. If they add yours back, it's mutual." },
      { property: "og:title", content: "Add a number — Sphere" },
      { property: "og:description", content: "Add someone's number. If they add yours back, it's mutual." },
    ],
  }),
  component: AddRoute,
});

function AddRoute() {
  const { accent, addOne } = useApp();
  const navigate = useNavigate();
  const { enabled: testModeEnabled } = useTestMode();
  const resolvePin = useServerFn(testmodeResolvePin);

  return (
    <ScreenAdd
      accent={accent}
      allowTestPin={testModeEnabled}
      onBack={() => navigate({ to: "/home" })}
      onBrowseContacts={() => navigate({ to: "/contacts" })}
      onSubmit={async (digits: string) => {
        try {
          let target = digits;
          if (testModeEnabled && digits.length === 4) {
            const { e164 } = await resolvePin({ data: { pin: digits } });
            target = e164; // synthetic E.164 for that PIN
          }
          await addOne(target);
          navigate({ to: "/sent" });
        } catch (e: any) {
          toast.error(e?.message || "Could not add number");
        }
      }}
    />
  );
}
