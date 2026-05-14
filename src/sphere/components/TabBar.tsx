import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { haptics } from "@/mutual/native/haptics";

const TABS = [
  { to: "/home", label: "SPHERE" },
  { to: "/matches", label: "MATCHES" },
  { to: "/profile", label: "PROFILE" },
] as const;

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="ios-tabbar border-t border-line pb-safe">
      <ul className="grid grid-cols-3">
        {TABS.map((t) => {
          const active =
            (t.to === "/home" && pathname === "/home") ||
            (t.to === "/profile" && pathname.startsWith("/profile")) ||
            (t.to === "/matches" && pathname.startsWith("/matches"));
          return (
            <li key={t.label} className="flex justify-center py-3.5">
              <Link
                to={t.to as any}
                onPointerDown={() => { if (!active) haptics.selection(); }}
                className={cn(
                  "font-mono text-[11px] uppercase transition-all duration-150 active:scale-95",
                  active ? "text-ink" : "text-mute",
                )}
                style={{ letterSpacing: "0.22em" }}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
