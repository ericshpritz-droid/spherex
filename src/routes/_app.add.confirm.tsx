import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { PrimaryButton, Eyebrow } from "@/sphere/ui";
import { formatPhone } from "@/mutual/brand.js";
import { useApp } from "@/mutual/AppContext";
import { toast } from "@/mutual/toast";

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
  const { addOne } = useApp();
  const [draft, setDraft] = useState<{ phone: string; ig: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function commit() {
    if (!draft || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!draft.phone) throw new Error("Missing phone number.");
      await addOne(draft.phone, "romantic");
      try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
      navigate({ to: "/add/patience" as any, replace: true });
    } catch (e: any) {
      const msg = e?.message || "Couldn't save your pick. Please try again.";
      setError(msg);
      toast(msg);
      setBusy(false);
    }
  }

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
          A sealed pick. Nothing is sent. If they pick you back, it's a mutual.
        </p>

        <div className="mt-7 space-y-3">
          <FieldRow
            icon={<PhoneIcon />}
            label="PHONE"
            value={formatPhone(draft.phone)}
            onEdit={() => navigate({ to: "/add/manual" as any, search: { focus: "phone" } as any })}
          />
          <FieldRow
            icon={<InstagramIcon />}
            label="INSTAGRAM"
            value={draft.ig ? `@${draft.ig}` : "— skipped —"}
            muted={!draft.ig}
            onEdit={() => navigate({ to: "/add/manual" as any, search: { focus: "ig" } as any })}
          />
        </div>

        <p className="mt-6 px-1 text-[13px] text-mute leading-snug">
          Both values get hashed before they leave your device. You can send a
          compliment once you're mutually matched.
        </p>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3">
        {error && (
          <div
            className="rounded-2xl border p-3 text-[13px] leading-snug"
            style={{ background: "#FBEBE6", borderColor: "#E8C7BD", color: "#7A2E1C" }}
            role="alert"
          >
            {error}
          </div>
        )}
        <PrimaryButton onClick={commit} disabled={busy}>
          {busy ? "Sealing…" : error ? "Try again" : "Seal pick"}
        </PrimaryButton>
      </div>
    </SphereScreen>
  );
}

function FieldRow({
  icon, label, value, muted, onEdit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
  onEdit: () => void;
}) {
  return (
    <button
      onClick={onEdit}
      className="group w-full text-left rounded-2xl bg-surface border border-line p-4 flex items-center gap-4 hover:border-[#D8D5D0] transition-colors"
    >
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center">
          {icon}
        </div>
        <span
          className="font-mono text-[10px] uppercase text-mute group-hover:text-ink transition-colors"
          style={{ letterSpacing: "0.22em" }}
        >
          Edit
        </span>
      </div>
      <div className="flex-1 min-w-0 text-right">
        <div
          className="font-mono text-[10px] uppercase text-mute"
          style={{ letterSpacing: "0.22em" }}
        >
          {label}
        </div>
        <div
          className={`mt-1 font-serif italic text-[20px] leading-tight truncate ${
            muted ? "text-mute" : "text-ink"
          }`}
        >
          {value}
        </div>
      </div>
    </button>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 4.5c0-.83.67-1.5 1.5-1.5h2.1c.66 0 1.24.43 1.43 1.07l1 3.3a1.5 1.5 0 0 1-.4 1.52L9.3 10.2a13 13 0 0 0 4.5 4.5l1.31-1.33a1.5 1.5 0 0 1 1.52-.4l3.3 1a1.5 1.5 0 0 1 1.07 1.43V17.5c0 .83-.67 1.5-1.5 1.5C11.4 19 5 12.6 5 4.5Z"
        fill="#1F8A52"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="#1A1A1A" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="#1A1A1A" strokeWidth="1.6" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="#1A1A1A" />
    </svg>
  );
}
