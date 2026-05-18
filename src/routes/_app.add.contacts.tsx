import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "../mutual/toast";
import { SphereContacts } from "@/sphere/screens/SphereContacts";
import { useApp } from "../mutual/AppContext";

export const Route = createFileRoute("/_app/add/contacts")({
  head: () => ({
    meta: [
      { title: "Pick from contacts — sphere" },
      { name: "description", content: "Add people from your contacts. We only use hashes — never upload raw." },
      { property: "og:title", content: "Pick from contacts — sphere" },
      { property: "og:description", content: "Add people from your contacts. We only use hashes — never upload raw." },
    ],
  }),
  component: AddContactsRoute,
});

function AddContactsRoute() {
  const { addMany } = useApp();
  const navigate = useNavigate();
  return (
    <SphereContacts
      onBack={() => navigate({ to: "/add" })}
      onPick={async (phones: string[]) => {
        try {
          await addMany(phones);
          navigate({ to: "/sent" });
        } catch (e: any) {
          toast.error(e?.message || "Could not add contacts");
        }
      }}
    />
  );
}
