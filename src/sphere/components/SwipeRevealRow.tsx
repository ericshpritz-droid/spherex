import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  /** Action label revealed on swipe-left. */
  actionLabel: string;
  /** Called when user taps the revealed action. */
  onAction: () => void;
  /** Width (px) of the revealed action panel. */
  actionWidth?: number;
  className?: string;
};

/**
 * iOS-style swipe-to-reveal row. Swipe left to expose an action
 * (e.g. "Remove") behind the row; tap to invoke. Tap outside or
 * swipe back to dismiss. Only opens on a clear horizontal gesture
 * so it doesn't fight vertical scrolling or the tab swipe.
 */
export function SwipeRevealRow({
  children,
  actionLabel,
  onAction,
  actionWidth = 96,
  className,
}: Props) {
  const [tx, setTx] = useState(0);
  const [open, setOpen] = useState(false);
  const startRef = useRef<{ x: number; y: number; t: number; axis: "none" | "h" | "v" } | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setTx(0);
      }
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), axis: "none" };
  }
  function onPointerMove(e: React.PointerEvent) {
    const s = startRef.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (s.axis === "none") {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      // Require a clearly horizontal gesture
      if (Math.abs(dx) > Math.abs(dy) * 1.6) {
        s.axis = "h";
      } else {
        s.axis = "v";
        return;
      }
    }
    if (s.axis !== "h") return;
    // base offset (already-open state) + drag delta, clamped
    const base = open ? -actionWidth : 0;
    let next = base + dx;
    if (next > 0) next = next * 0.25; // light resistance pulling right
    if (next < -actionWidth - 24) next = -actionWidth - 24;
    setTx(next);
  }
  function onPointerUp() {
    const s = startRef.current;
    startRef.current = null;
    if (!s || s.axis !== "h") {
      setTx(open ? -actionWidth : 0);
      return;
    }
    // Snap based on final position
    if (tx <= -actionWidth * 0.5) {
      setOpen(true);
      setTx(-actionWidth);
    } else {
      setOpen(false);
      setTx(0);
    }
  }

  return (
    <div ref={wrapRef} className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Action panel behind */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ width: actionWidth }}
      >
        <button
          type="button"
          onClick={() => {
            onAction();
            setOpen(false);
            setTx(0);
          }}
          className="flex-1 bg-danger text-white font-sans text-[13px] font-medium tracking-tight active:opacity-90"
        >
          {actionLabel}
        </button>
      </div>
      {/* Foreground row */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translate3d(${tx}px,0,0)`,
          transition: startRef.current ? "none" : "transform 220ms cubic-bezier(0.22,1,0.36,1)",
          touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}
