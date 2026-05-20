import * as React from "react";
import { haptics } from "@/mutual/native/haptics";

interface UpgradeSheetProps {
  open: boolean;
  onClose: () => void;
  /** number of slots currently filled (0..3) */
  filled: number;
  onConfirmUpgrade: () => void;
}

/**
 * Dark bottom sheet from the redesign mockup.
 * - Eyebrow: "Room for two more"
 * - Headline: "Your Sphere can hold up to 3"
 * - Three slot tiles (filled / open)
 * - Gold pill: "unlock sphere+" (no price)
 * - Tapping the gold pill reveals a slide-to-confirm slider
 *   (the "slider pops up" interaction).
 */
export function UpgradeSheet({ open, onClose, filled, onConfirmUpgrade }: UpgradeSheetProps) {
  const [showSlider, setShowSlider] = React.useState(false);

  React.useEffect(() => {
    if (!open) setShowSlider(false);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    haptics.light();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const remaining = Math.max(0, 3 - filled);
  const eyebrow =
    remaining === 0 ? "Sphere is full" :
    remaining === 1 ? "Room for one more" :
    "Room for two more";

  return (
    <div
      aria-hidden={!open}
      className={`absolute inset-0 z-40 flex items-end justify-center ${open ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`relative w-full rounded-t-[28px] pt-3 px-6 pb-8 transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{
          background: "#0B0A09",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.5)",
          paddingBottom: `calc(env(safe-area-inset-bottom) + 1.75rem)`,
        }}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-fg-30" />

        {/* Header row */}
        <div className="mt-5 flex items-start justify-between">
          <div
            className="font-mono text-[10px] uppercase text-gold pt-1"
            style={{ letterSpacing: "0.28em" }}
          >
            ★ {eyebrow}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full border border-fg-30 text-paper text-[14px] flex items-center justify-center bg-transparent"
          >
            ×
          </button>
        </div>

        {/* Headline */}
        <h2 className="mt-5 font-serif text-paper text-[40px] leading-[1.05] tracking-tight">
          Your Sphere can hold{" "}
          <span className="italic text-gold">up to 3</span>
        </h2>

        {/* Slot tiles */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => {
            const isFilled = i < filled;
            return (
              <div
                key={i}
                className={`rounded-2xl border aspect-square flex flex-col items-center justify-center px-2 ${
                  isFilled
                    ? "border-gold/40 bg-gold/[0.04]"
                    : "border-fg-25 border-dashed bg-transparent"
                }`}
              >
                {isFilled ? (
                  <div
                    className="w-7 h-7 rounded-full bg-gold-soft"
                    style={{ boxShadow: "0 0 16px 4px rgba(240,220,160,0.45)" }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full border border-dashed border-fg-40" />
                )}
                <div
                  className={`mt-3 font-serif italic text-[14px] ${isFilled ? "text-paper" : "text-fg-50"}`}
                >
                  {isFilled ? `0${i + 1}` : "open"}
                </div>
                <div
                  className="mt-1 font-mono text-[9px] uppercase text-fg-40"
                  style={{ letterSpacing: "0.22em" }}
                >
                  {isFilled ? "added" : `0${i + 1}`}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA / slider */}
        <div className="mt-7">
          {!showSlider ? (
            <button
              type="button"
              onClick={() => { haptics.light(); setShowSlider(true); }}
              className="w-full h-14 rounded-full bg-gold text-ink font-serif italic text-[17px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ boxShadow: "0 0 32px 4px rgba(230,196,106,0.32)" }}
            >
              <span className="text-[14px]">✦</span>
              <span>unlock sphere+</span>
            </button>
          ) : (
            <SlideToConfirm
              onConfirm={() => { haptics.medium(); onConfirmUpgrade(); }}
              label="slide to unlock sphere+"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            className="block mx-auto mt-4 font-serif italic text-[14px] text-fg-50 bg-transparent border-0"
          >
            not now
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Slide-to-confirm thumb. Drag the gold knob to the right edge to fire.
 */
function SlideToConfirm({ onConfirm, label }: { onConfirm: () => void; label: string }) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [x, setX] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const drag = React.useRef<{ startX: number; pid: number | null; w: number }>({
    startX: 0, pid: null, w: 0,
  });
  const KNOB = 56;

  const setKnob = (px: number) => {
    const w = trackRef.current?.clientWidth ?? 0;
    const max = Math.max(0, w - KNOB - 4);
    setX(Math.min(max, Math.max(0, px)));
  };

  const onDown = (e: React.PointerEvent) => {
    if (done) return;
    drag.current = {
      startX: e.clientX - x,
      pid: e.pointerId,
      w: trackRef.current?.clientWidth ?? 0,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (drag.current.pid !== e.pointerId) return;
    setKnob(e.clientX - drag.current.startX);
  };
  const onUp = (e: React.PointerEvent) => {
    if (drag.current.pid !== e.pointerId) return;
    drag.current.pid = null;
    const w = trackRef.current?.clientWidth ?? 0;
    const max = Math.max(0, w - KNOB - 4);
    if (x >= max - 4) {
      setDone(true);
      setX(max);
      setTimeout(onConfirm, 180);
    } else {
      setX(0);
    }
  };

  return (
    <div
      ref={trackRef}
      className="relative w-full h-14 rounded-full overflow-hidden border border-gold/40"
      style={{ background: "rgba(230,196,106,0.08)" }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="font-serif italic text-[15px] text-gold/80">
          {done ? "unlocking…" : label}
        </span>
      </div>
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="absolute top-1/2 -translate-y-1/2 left-[2px] rounded-full bg-gold flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        style={{
          width: KNOB, height: KNOB - 4,
          transform: `translate(${x}px, -50%)`,
          transition: drag.current.pid === null ? "transform 180ms cubic-bezier(.32,.72,0,1)" : "none",
          boxShadow: "0 0 18px rgba(230,196,106,0.5)",
        }}
        aria-label={label}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={done ? 100 : Math.round((x / Math.max(1, (trackRef.current?.clientWidth ?? 1) - KNOB - 4)) * 100)}
      >
        <span className="text-ink text-[18px]">→</span>
      </div>
    </div>
  );
}
