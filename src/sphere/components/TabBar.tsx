import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/home", label: "SPHERE" },
  { to: "/inbox", label: "INBOX" },
  { to: "/profile", label: "PROFILE" },
] as const;

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="border-t border-line bg-paper">
      <ul className="grid grid-cols-3">
        {TABS.map((t) => {
          const active =
            (t.to === "/home" && pathname === "/home") ||
            (t.to === "/profile" && pathname.startsWith("/profile")) ||
            (t.to === "/inbox" && pathname.startsWith("/inbox"));
          return (
            <li key={t.label} className="flex justify-center py-4">
              <Link
                to={t.to as any}
                className={cn(
                  "font-mono text-[11px] uppercase",
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
