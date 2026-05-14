// iOS-style edge-swipe-back: a horizontal drag starting within ~24px of the
// left edge that exceeds 60px triggers history.back(). Live-translates the
// element so the user gets the rubber-band feedback while dragging.
import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";

const EDGE_PX = 24;
const TRIGGER_PX = 70;
const MAX_DRAG = 220;

export function useEdgeSwipeBack(enabled = true) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let pid: number | null = null;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      if (e.clientX > EDGE_PX) return;
      startX = e.clientX;
      startY = e.clientY;
      dragging = true;
      pid = e.pointerId;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pid) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dy) > Math.abs(dx)) {
        // vertical scroll wins
        dragging = false;
        el.style.transform = "";
        return;
      }
      const t = Math.max(0, Math.min(MAX_DRAG, dx));
      el.style.transform = `translate3d(${t}px,0,0)`;
      el.style.transition = "none";
      el.style.boxShadow = `${-12 + Math.min(0, -dx / 6)}px 0 24px rgba(0,0,0,${Math.min(0.18, dx / 1200)})`;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pid) return;
      const dx = e.clientX - startX;
      dragging = false;
      el.style.transition = "transform 220ms cubic-bezier(.32,.72,0,1), box-shadow 220ms";
      el.style.transform = "";
      el.style.boxShadow = "";
      if (dx > TRIGGER_PX) {
        try { router.history.back(); } catch {}
      }
    };

    el.addEventListener("pointerdown", onDown, { passive: true });
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerup", onUp, { passive: true });
    el.addEventListener("pointercancel", onUp, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [enabled, router]);

  return ref;
}
