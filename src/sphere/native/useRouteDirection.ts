// Tracks whether the most recent navigation was a forward push or a back pop,
// so the route transition can slide the right way (iOS stack semantics).
import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";

export type NavDir = "forward" | "back" | "replace" | "initial";

export function useRouteDirection(): { dir: NavDir; key: string } {
  const { pathname } = useLocation();
  const stackRef = useRef<string[]>([pathname]);
  const [dir, setDir] = useState<NavDir>("initial");

  useEffect(() => {
    const stack = stackRef.current;
    const last = stack[stack.length - 1];
    if (last === pathname) return;

    const prevIdx = stack.lastIndexOf(pathname);
    if (prevIdx >= 0 && prevIdx < stack.length - 1) {
      // Going back to a route we've seen
      stack.length = prevIdx + 1;
      setDir("back");
    } else {
      stack.push(pathname);
      setDir("forward");
    }
  }, [pathname]);

  return { dir, key: pathname };
}
