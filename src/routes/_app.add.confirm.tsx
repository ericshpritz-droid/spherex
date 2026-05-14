import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, Eyebrow } from "@/sphere/ui";
import { formatPhone } from "@/mutual/brand.js";

export const Route = createFileRoute("/_app/add/confirm")({
  head: () => ({
    meta: [
      { title: "Confirm — sphere" },
      { name: "description", content: "Double-check before you commit." },
    ],
  }),
  component: ConfirmAdd,
});

const DRAFT_KEY = "sphere.addDraft";

function ConfirmAdd() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<{ phone: string; ig: string } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) {
        navigate({ to: "/add/manual" as any, replace: true });
        return;
      }
      setDraft(JSON.parse(raw));
    } catch {
      navigate({ to: "/add/manual" as any, replace: true });
    }
  }, [navigate]);

  if (!draft) return <SphereScreen>{null}</SphereScreen>;

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <button
          onClick={() => navigate({ to: "/add/manual" as any })}
          className="text-ink/80 text-[18px] -ml-1 px-2"
          aria-label="Back"
        >
          ←
        </button>
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4" data-scroll>
        <Eyebrow>Looks right?</Eyebrow>
        <h1 className="mt-2 font-serif italic text-[36px] leading-[1.04] tracking-tight">
          Double-check.
        </h1>
        <p className="mt-3 text-[14px] text-mute">
          Tap a field to edit. Nothing is sent until the next screen.
        </p>

        <div className="mt-7 space-y-3">
          <FieldRow
            label="PHONE"
            value={formatPhone(draft.phone)}
            onEdit={() => navigate({ to: "/add/manual" as any, search: { focus: "phone" } as any })}
          />
          <FieldRow
            label="INSTAGRAM"
            value={draft.ig ? `@${draft.ig}` : "— skipped —"}
            onEdit={() => navigate({ to: "/add/manual" as any, search: { focus: "ig" } as any })}
          />
        </div>

        <div className="mt-6 rounded-2xl bg-[#EFECE5] p-4 text-[13px] text-mute">
          Both values get hashed on the next screen, before they leave your device.
        </div>
      </div>

      <div className="px-6 pb-8 pt-4">
        <PrimaryButton onClick={() => navigate({ to: "/add/intent" as any })}>
          Looks right — continue
        </PrimaryButton>
      </div>
    </SphereScreen>
  );
}

function FieldRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <button
      onClick={onEdit}
      className="w-full text-left rounded-2xl bg-white border border-line p-4 flex items-center justify-between gap-4 hover:border-[#D8D5D0]"
    >
      <div className="min-w-0">
        <Eyebrow>{label}</Eyebrow>
        <div className="mt-1 font-serif text-[20px] leading-tight truncate">{value}</div>
      </div>
      <span className="text-mute text-[12px] font-mono uppercase"
        style={{ letterSpacing: "0.22em" }}
      >
        Edit
      </span>
    </button>
  );
}
