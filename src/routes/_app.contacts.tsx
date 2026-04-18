import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenContacts } from "../mutual/screens/Main.jsx";
import { useApp } from "../mutual/AppContext";

export const Route = createFileRoute("/_app/contacts")({
  head: () => ({
    meta: [
      { title: "Pick from contacts — Sphere" },
      { name: "description", content: "Add people from your contacts. We only use hashes — never upload raw." },
      { property: "og:title", content: "Pick from contacts — Sphere" },
      { property: "og:description", content: "Add people from your contacts. We only use hashes — never upload raw." },
    ],
  }),
  component: ContactsRoute,
});

function ContactsRoute() {
  const { accent, addMany } = useApp();
  const navigate = useNavigate();
  return (
    <ScreenContacts
      accent={accent}
      onBack={() => navigate({ to: "/add" })}
      onPick={async (phones: string[]) => {
        try {
          await addMany(phones);
          navigate({ to: "/sent" });
        } catch (e: any) {
          alert(e?.message || "Could not add contacts");
        }
      }}
    />
  );
}
