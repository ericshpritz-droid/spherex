import * as React from "react";
import { cn } from "@/lib/utils";
import { haptics } from "@/mutual/native/haptics";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /** Disable drag-to-dismiss (e.g. when a destructive form is mid-typing) */
  dismissable?: boolean;
}

const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.6; // px/ms

export function Sheet({ open, onClose, children, className, dismissable = true }: SheetProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{
    startY: number;
    startT: number;
    pid: number | null;
    dragging: boolean;
    fromHandle: boolean;
  }>({ startY: 0, startT: 0, pid: null, dragging: false, fromHandle: false });
  const wasOpen = React.useRef(false);

  // Esc to close + open/close haptic
  React.useEffect(() => {
    if (open && !wasOpen.current) haptics.light();
    wasOpen.current = open;
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const setTranslate = (y: number, animate = false) => {
    const el = panelRef.current;
    if (!el) return;
    el.style.transition = animate ? "transform 240ms cubic-bezier(.32,.72,0,1)" : "none";
    el.style.transform = `translate3d(0, ${y}px, 0)`;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!dismissable) return;
    const target = e.target as HTMLElement;
    const fromHandle = !!target.closest("[data-sheet-handle]");
    // Only allow dragging from handle OR when the inner content isn't scrolled
    const inner = target.closest("[data-sheet-scroll]") as HTMLElement | null;
    if (!fromHandle && inner && inner.scrollTop > 0) return;
    dragRef.current = {
      startY: e.clientY,
      startT: performance.now(),
      pid: e.pointerId,
      dragging: true,
      fromHandle,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.dragging || d.pid !== e.pointerId) return;
    const dy = e.clientY - d.startY;
    if (dy <= 0) {
      // rubber-band when pulling up
      setTranslate(Math.max(-12, dy / 4));
      return;
    }
    setTranslate(dy);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.dragging || d.pid !== e.pointerId) return;
    const dy = e.clientY - d.startY;
    const dt = performance.now() - d.startT;
    const v = dy / Math.max(dt, 1);
    d.dragging = false;
    if (dy > DISMISS_DISTANCE || v > DISMISS_VELOCITY) {
      // Slide off, then close
      const el = panelRef.current;
      if (el) {
        el.style.transition = "transform 220ms cubic-bezier(.32,.72,0,1)";
        el.style.transform = "translate3d(0, 110%, 0)";
      }
      haptics.light();
      window.setTimeout(onClose, 200);
    } else {
      setTranslate(0, true);
    }
  };

  // Reset transform when reopening
  React.useEffect(() => {
    if (open) setTranslate(0, false);
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "absolute inset-0 z-40 flex items-end justify-center pointer-events-none",
        open && "pointer-events-auto",
      )}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={panelRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          paddingBottom: `calc(env(safe-area-inset-bottom) + 1.25rem + var(--kb-inset, 0px))`,
        }}
        className={cn(
          "relative w-full bg-paper rounded-t-[28px] pt-3 px-5",
          "shadow-[0_-12px_40px_rgba(0,0,0,0.18)]",
          "transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full",
          "touch-none",
          className,
        )}
      >
        <div
          data-sheet-handle
          className="mx-auto h-1.5 w-10 rounded-full bg-[#D8D5D0] cursor-grab active:cursor-grabbing"
        />
        <div data-sheet-scroll className="mt-4 max-h-[78vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
