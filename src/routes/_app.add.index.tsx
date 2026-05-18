import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";

import { Sheet, GhostButton, Eyebrow } from "@/sphere/ui";
import { AvatarMono, initialsFromHash } from "@/sphere/components/AvatarMono";
import { useApp } from "@/mutual/AppContext";

export const Route = createFileRoute("/_app/add/")({
  head: () => ({
    meta: [
      { title: "Add someone — sphere" },
      { name: "description", content: "Pick from contacts, type a number, or add a handle." },
    ],
  }),
  component: AddSheetRoute,
});

const FREE_LIMIT = 1;

function AddSheetRoute() {
  const navigate = useNavigate();
  const { matches, pending } = useApp();
  const [open, setOpen] = useState(true);

  const slotsUsed = matches.length + pending.length;
  const slotN = Math.min(slotsUsed + 1, FREE_LIMIT);

  function close() {
    setOpen(false);
    setTimeout(() => navigate({ to: "/home" }), 220);
  }

  return (
    <SphereScreen>
      {/* Faded preview of the home behind the sheet */}
      <div className="flex-1 overflow-hidden px-6 pt-12 opacity-50 pointer-events-none">
        <div className="font-serif italic text-[22px]">sphere</div>
        <div className="mt-6 font-serif italic text-[34px] leading-[1.05] tracking-tight">
          Three picks. Sealed unless mutual.
        </div>
        <div className="mt-7 flex gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i}
              className="h-12 w-12 rounded-full border border-dashed border-[#C9C5BC]"
            />
          ))}
        </div>
      </div>
      

      <Sheet open={open} onClose={close}>
        <Eyebrow>Slot {slotN} of {FREE_LIMIT}</Eyebrow>
        <h2 className="mt-2 font-serif italic text-[28px] leading-tight">
          Add someone to your sphere.
        </h2>
        <p className="mt-2 text-[13px] text-mute">
          Anonymous unless mutual. They'll never know it was you.
        </p>

        <div className="mt-6 space-y-3">
          <SheetOption
            initials="C"
            title="Pick from Contacts"
            sub="Fastest. We only read what you tap."
            onClick={() => navigate({ to: "/contacts" })}
          />
          <SheetOption
            initials="#"
            title="Type a phone number"
            sub="If you remember it, that counts."
            onClick={() => navigate({ to: "/add/manual" as any })}
          />
          <SheetOption
            initials="@"
            title="Add their @handle"
            sub="Instagram. Doubles match odds."
            onClick={() => navigate({ to: "/add/manual" as any, search: { ig: 1 } as any })}
          />
        </div>

        <div className="mt-3">
          <GhostButton onClick={close}>Cancel</GhostButton>
        </div>
      </Sheet>
    </SphereScreen>
  );
}

function SheetOption({
  initials, title, sub, onClick,
}: { initials: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-surface border border-line p-4 flex items-center gap-4 hover:border-[#D8D5D0]"
    >
      <AvatarMono initials={initials} size={42} />
      <div className="flex-1 min-w-0">
        <div className="font-serif text-[18px] leading-tight">{title}</div>
        <div className="mt-0.5 text-[13px] text-mute truncate">{sub}</div>
      </div>
      <span className="text-mute text-[18px]">→</span>
    </button>
  );
}
// silence unused import — initialsFromHash kept for parity with home screen
void initialsFromHash;
