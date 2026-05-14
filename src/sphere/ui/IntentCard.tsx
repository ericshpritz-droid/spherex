import * as React from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

interface IntentCardProps {
  label: string;          // "OPTION 01"
  title: string;          // serif title
  body?: string;
  inverted?: boolean;     // black-fill variant for "MOST POPULAR"
  badge?: string;         // small caps badge top-right
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function IntentCard({
  label, title, body, inverted, badge, selected, onClick, className,
}: IntentCardProps) {
  const dark = inverted || selected;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border p-5 transition-colors",
        dark
          ? "bg-ink text-paper border-ink"
          : "bg-white text-ink border-line hover:border-[#D8D5D0]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Eyebrow className={dark ? "text-paper/60" : "text-mute"}>{label}</Eyebrow>
        {badge && (
          <Eyebrow className={dark ? "text-paper" : "text-ink"}>{badge}</Eyebrow>
        )}
      </div>
      <div
        className={cn(
          "mt-2 font-serif italic leading-[1.05]",
          "text-[28px]",
        )}
      >
        {title}
      </div>
      {body && (
        <div className={cn("mt-2 font-sans text-[14px] leading-snug", dark ? "text-paper/70" : "text-mute")}>
          {body}
        </div>
      )}
    </button>
  );
}
