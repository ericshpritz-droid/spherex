// Horizontal swipe to switch between the 3 main tabs (Sphere → Matches → Profile).
// Only active when current path matches one of the tabs and the gesture did NOT
// start within the edge-back zone. Vertical intent (scrolling) cancels.
import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { haptics } from "@/mutual/native/haptics";

const TABS = ["/home", "/matches", "/profile"] as const;
type Tab = (typeof TABS)[number];

const EDGE_IGNORE_PX = 24;       // don't fight edge-swipe-back
const DECIDE_PX = 12;             // movement before we lock an axis
const HORIZONTAL_RATIO = 1.7;     // |dx| must dominate |dy| by this much
const VERTICAL_ABORT_PX = 18;     // if vertical movement exceeds this before decision → scroll
const TRIGGER_PX = 60;            // minimum horizontal distance to switch
const MAX_DURATION_MS = 600;      // flicks only; slow drags are likely scrolls

type Axis = "none" | "horizontal" | "vertical";

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
    let startT = 0;
    let active = false;
    let pid: number | null = null;
    let axis: Axis = "none";

    const reset = () => {
      active = false;
      axis = "none";
      pid = null;
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      if (e.clientX <= EDGE_IGNORE_PX) return;
      startX = e.clientX;
      startY = e.clientY;
      startT = performance.now();
      active = true;
      axis = "none";
      pid = e.pointerId;
    };
    const onMove = (e: PointerEvent) => {
      if (!active || e.pointerId !== pid) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (axis === "none") {
        // Abort early if the user is clearly scrolling vertically.
        if (Math.abs(dy) >= VERTICAL_ABORT_PX && Math.abs(dy) > Math.abs(dx)) {
          reset();
          return;
        }
        const dist = Math.hypot(dx, dy);
        if (dist < DECIDE_PX) return;
        if (Math.abs(dx) >= Math.abs(dy) * HORIZONTAL_RATIO) {
          axis = "horizontal";
        } else {
          // Vertical or ambiguous → let the page scroll, don't reclaim.
          reset();
        }
      } else if (axis === "horizontal") {
        // If a horizontal gesture suddenly goes vertical, cancel.
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > VERTICAL_ABORT_PX) {
          reset();
        }
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!active || e.pointerId !== pid) return;
      const dx = e.clientX - startX;
      const dt = performance.now() - startT;
      const wasHorizontal = axis === "horizontal";
      reset();
      if (!wasHorizontal) return;
      if (dt > MAX_DURATION_MS) return;
      if (Math.abs(dx) < TRIGGER_PX) return;
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
