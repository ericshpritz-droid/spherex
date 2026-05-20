import * as React from "react";
import { haptics } from "@/mutual/native/haptics";

interface WaitingCardProps {
  index: number; // 1-based slot number
  name: string;
  onSendCompliment: () => void;
}

/**
 * The "first in your sphere" framed card from the redesign mockup.
 * Dark surface, corner brackets, glowing star, large serif name,
 * and a single gold "send a compliment" pill.
 */
export function WaitingCard({ index, name, onSendCompliment }: WaitingCardProps) {
  const label = String(index).padStart(2, "0");
  return (
    <div className="relative rounded-[28px] border border-fg-08 bg-glass-04 px-6 pt-6 pb-8 overflow-hidden">
      {/* Corner brackets */}
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />

      {/* Eyebrow */}
      <div
        className="text-center font-mono text-[10px] uppercase text-gold"
        style={{ letterSpacing: "0.28em" }}
      >
        <span className="opacity-80">★ {label}</span>
        <span className="opacity-50 mx-2">·</span>
        <span>{index === 1 ? "First in your sphere" : "In your sphere"}</span>
      </div>

      {/* Glowing star */}
      <div className="mt-6 mb-2 flex items-center justify-center">
        <Star />
      </div>

      {/* Name */}
      <h2 className="mt-4 text-center font-serif text-[44px] leading-[1.02] tracking-tight text-paper">
        {name}
      </h2>

      <p className="mt-3 text-center font-serif italic text-[14px] text-fg-50 leading-snug px-2">
        They'll see your compliment the moment they add you back.
      </p>

      {/* Gold pill */}
      <div className="mt-6 flex items-center justify-center">
        <button
          type="button"
          onClick={() => { haptics.light(); onSendCompliment(); }}
          className="inline-flex items-center gap-2 rounded-full bg-gold text-ink font-serif italic text-[16px] px-7 h-12 select-none touch-manipulation transition-transform active:scale-[0.97]"
          style={{
            boxShadow: "0 0 28px 4px rgba(230,196,106,0.28), 0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          <span className="text-[14px]">✦</span>
          <span>send a compliment</span>
        </button>
      </div>
    </div>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute w-3 h-3 border-gold/60";
  const map: Record<typeof pos, string> = {
    tl: "top-2 left-2 border-t border-l",
    tr: "top-2 right-2 border-t border-r",
    bl: "bottom-2 left-2 border-b border-l",
    br: "bottom-2 right-2 border-b border-r",
  };
  return <span className={`${base} ${map[pos]}`} aria-hidden />;
}

function Star() {
  return (
    <div className="relative w-[160px] h-[160px] flex items-center justify-center">
      {/* outer glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(230,196,106,0.55) 0%, rgba(230,196,106,0.15) 35%, rgba(230,196,106,0) 70%)",
          filter: "blur(2px)",
        }}
      />
      {/* core */}
      <div
        className="relative w-[44px] h-[44px] rounded-full bg-gold-soft"
        style={{
          boxShadow:
            "0 0 24px 8px rgba(240,220,160,0.7), 0 0 60px 18px rgba(230,196,106,0.35)",
        }}
      />
      {/* cross hairs */}
      <span
        className="absolute left-0 right-0 mx-auto h-px bg-gold/40"
        style={{ top: "50%" }}
        aria-hidden
      />
      <span
        className="absolute top-0 bottom-0 my-auto w-px bg-gold/40"
        style={{ left: "50%" }}
        aria-hidden
      />
    </div>
  );
}
