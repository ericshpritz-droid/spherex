import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ScreenAdd } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";

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
  return (
    <ScreenAdd
      accent={accent}
      onBack={() => navigate({ to: "/home" })}
      onBrowseContacts={() => navigate({ to: "/contacts" })}
      onSubmit={async (digits: string) => {
        try {
          await addOne(digits);
          navigate({ to: "/sent" });
        } catch (e: any) {
          toast.error(e?.message || "Could not add number");
        }
      }}
    />
  );
}
