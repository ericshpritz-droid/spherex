import * as React from "react";
import { useTheme, type ThemeMode } from "@/lib/theme";

const MODES: { mode: ThemeMode; label: string; glyph: string }[] = [
  { mode: "light", label: "Light", glyph: "☀" },
  { mode: "system", label: "Auto", glyph: "◐" },
  { mode: "dark", label: "Dark", glyph: "☾" },
];

/**
 * Compact light/auto/dark segmented control. Self-contained styles so it
 * works on either a paper or dark-accent surface (uses white-alpha chrome).
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, setMode } = useTheme();
  return (
    <div
      className={
        "inline-flex items-center gap-1 rounded-full p-1 text-ink " +
        "bg-[color-mix(in_oklab,var(--ink)_10%,transparent)] " +
        "border border-[color-mix(in_oklab,var(--ink)_18%,transparent)] " +
        "backdrop-blur-md " +
        className
      }
      role="radiogroup"
      aria-label="Theme"
    >
      {MODES.map((m) => {
        const active = mode === m.mode;
        return (
          <button
            key={m.mode}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={m.label}
            title={m.label}
            onClick={() => setMode(m.mode)}
            className={
              "rounded-full text-[12px] font-semibold cursor-pointer transition-colors border-0 " +
              (active
                ? "bg-ink text-paper"
                : "bg-transparent text-[color-mix(in_oklab,var(--ink)_70%,transparent)]")
            }
            style={{ padding: "4px 10px", minWidth: 36 }}
          >
            <span aria-hidden>{m.glyph}</span>
          </button>
        );
      })}
    </div>
  );
}
