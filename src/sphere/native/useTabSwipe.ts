// Horizontal swipe to switch between the 3 main tabs (Sphere → Matches → Profile).
// Only active when current path matches one of the tabs and the gesture did NOT
// start within the edge-back zone. Vertical intent (scrolling) cancels.
import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { haptics } from "@/mutual/native/haptics";

const TABS = ["/home", "/matches", "/profile"] as const;
type Tab = (typeof TABS)[number];

const EDGE_IGNORE_PX = 24;     // don't fight edge-swipe-back
const TRIGGER_PX = 70;          // minimum horizontal distance to switch
const VERTICAL_CANCEL_RATIO = 1; // if |dy| > |dx|, treat as scroll

export function useTabSwipe(currentPath: string) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const idx = TABS.indexOf(currentPath as Tab);
    if (idx === -1) return;
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let active = false;
    let pid: number | null = null;
    let decided = false; // once we know horizontal vs vertical

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      // Skip the left edge — that belongs to edge-swipe-back.
      if (e.clientX <= EDGE_IGNORE_PX) return;
      startX = e.clientX;
      startY = e.clientY;
      active = true;
      decided = false;
      pid = e.pointerId;
    };
    const onMove = (e: PointerEvent) => {
      if (!active || e.pointerId !== pid) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!decided) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        decided = true;
        if (Math.abs(dy) * VERTICAL_CANCEL_RATIO > Math.abs(dx)) {
          active = false;
          return;
        }
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!active || e.pointerId !== pid) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      active = false;
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (Math.abs(dx) < TRIGGER_PX) return;
      // Swipe right (dx > 0) → previous tab; swipe left → next tab.
      const dir = dx > 0 ? -1 : 1;
      const next = idx + dir;
      if (next < 0 || next >= TABS.length) return;
      haptics.selection();
      navigate({ to: TABS[next], replace: true });
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
  }, [currentPath, navigate]);

  return ref;
}
