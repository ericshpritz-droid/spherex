import * as React from "react";
import { SphereScreen } from "@/sphere/components/SphereScreen";
import { AvatarMono, initialsFromHash } from "@/sphere/components/AvatarMono";
import { Eyebrow } from "@/sphere/ui";

type ContactPhotos = {
  enabled: boolean;
  status: string;
  count: number;
  onToggle: (next: boolean) => void;
  onRefresh: () => void | Promise<void>;
  onOpenSettings: () => void | Promise<void>;
} | null;

type Feel = {
  reduced: boolean;
  onToggleReduced: (nextReduced: boolean) => void;
} | null;

const ACCENTS: Array<{ key: "pink" | "lavender" | "blue"; label: string }> = [
  { key: "pink", label: "Pink" },
  { key: "lavender", label: "Lavender" },
  { key: "blue", label: "Blue" },
];

const ACCENT_DOT: Record<string, string> = {
  pink: "#F13F5E",
  lavender: "#B08AFC",
  blue: "#5B7BFF",
};

export function SphereProfile({
  accent,
  onAccent,
  phone,
  onSignOut,
  contactPhotos = null,
  feel = null,
  topSlot,
  bottomSlot,
}: {
  accent: "pink" | "lavender" | "blue";
  onAccent: (a: "pink" | "lavender" | "blue") => void;
  phone?: string;
  onSignOut: () => void;
  contactPhotos?: ContactPhotos;
  feel?: Feel;
  topSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
}) {
  const displayPhone = phone || "—";

  let photosLabel = "";
  if (contactPhotos) {
    if (contactPhotos.status === "unsupported") photosLabel = "iOS only";
    else if (contactPhotos.status === "denied") photosLabel = "Permission denied";
    else if (contactPhotos.status === "loading") photosLabel = "Loading…";
    else if (contactPhotos.status === "ready")
      photosLabel = `${contactPhotos.count} matched`;
    else if (contactPhotos.status === "disabled") photosLabel = "Off";
    else if (contactPhotos.status === "error") photosLabel = "Error";
  }

  return (
    <SphereScreen>
      <div className="flex items-center justify-between px-6 pt-12 pb-2">
        <div className="font-serif italic text-[18px]">sphere</div>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-40" data-scroll>
        {/* Identity card */}
        <div className="flex flex-col items-center text-center">
          <AvatarMono initials={initialsFromHash(displayPhone)} size={88} />
          <div className="mt-4 font-serif italic text-[28px] leading-tight">
            {displayPhone}
          </div>
          <div
            className="mt-1 font-mono text-[10px] uppercase text-mute"
            style={{ letterSpacing: "0.22em" }}
          >
            Signed in
          </div>
        </div>

        {topSlot && <div className="mt-6">{topSlot}</div>}

        {contactPhotos && contactPhotos.status !== "unsupported" && (
          <Section title="Contact photos">
            <ToggleRow
              label="Use contact photos"
              sub="Use your iPhone contact photos on cards. Photos stay on your device."
              checked={
                contactPhotos.enabled && contactPhotos.status !== "denied"
              }
              onChange={contactPhotos.onToggle}
            />
            <Row label="Status" value={photosLabel} />
            <Row
              label="Refresh photos"
              value="↻"
              onClick={() => contactPhotos.onRefresh()}
            />
            <Row
              label="Open iOS Settings"
              value="→"
              onClick={() => contactPhotos.onOpenSettings()}
              last
            />
          </Section>
        )}

        {feel && (
          <Section title="Feel">
            <ToggleRow
              label="Reduce haptics"
              sub="Mute the taptic ticks on buttons, the keypad, and notifications."
              checked={feel.reduced}
              onChange={feel.onToggleReduced}
              last
            />
          </Section>
        )}

        <Section title="Privacy">
          <Row label="Your number" value={displayPhone} />
          <Row label="Visible to" value="No one" last />
        </Section>

        {bottomSlot && <div className="mt-2 mb-6">{bottomSlot}</div>}

        <Section title="Account">
          <Row label="Sign out" value="→" onClick={onSignOut} danger last />
        </Section>
      </div>
    </SphereScreen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-7">
      <div className="px-2 pb-2">
        <Eyebrow>{title}</Eyebrow>
      </div>
      <div className="rounded-2xl bg-surface border border-line overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  onClick,
  danger,
  last,
}: {
  label: string;
  value?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3.5 ${
        last ? "" : "border-b border-line"
      } ${onClick ? "cursor-pointer hover:bg-ink/[0.03]" : ""}`}
    >
      <span
        className={`text-[15px] font-medium ${
          danger ? "text-[#C44569]" : "text-ink"
        }`}
      >
        {label}
      </span>
      {value !== undefined && (
        <span className="text-[14px] text-mute">{value}</span>
      )}
    </Comp>
  );
}

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
  last,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 px-4 py-3.5 ${
        last ? "" : "border-b border-line"
      }`}
    >
      <div className="min-w-0">
        <div className="text-[15px] font-medium text-ink">{label}</div>
        {sub && <div className="text-[12px] text-mute mt-1 leading-snug">{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        className="shrink-0 rounded-full transition-colors border-0 cursor-pointer mt-0.5"
        style={{
          width: 44,
          height: 26,
          padding: 2,
          background: checked ? "var(--ink)" : "color-mix(in oklab, var(--ink) 15%, transparent)",
        }}
      >
        <span
          className="block rounded-full transition-transform"
          style={{
            width: 22,
            height: 22,
            background: "var(--paper)",
            transform: checked ? "translateX(18px)" : "translateX(0)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          }}
        />
      </button>
    </div>
  );
}
