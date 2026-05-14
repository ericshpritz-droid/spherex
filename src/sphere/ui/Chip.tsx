import * as React from "react";
import { cn } from "@/lib/utils";
import { haptics } from "@/mutual/native/haptics";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  on?: boolean;
  as?: "button" | "span";
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, on = false, as = "button", children, onPointerDown, ...props }, ref) => {
    const cls = cn(
      "inline-flex items-center justify-center rounded-full px-4 h-9",
      "font-sans text-[14px] font-medium tracking-tight",
      "border transition-all duration-100 select-none touch-manipulation",
      "active:scale-[0.95]",
      on
        ? "bg-ink text-paper border-ink"
        : "bg-surface text-ink border-line hover:bg-surface-2",
      className,
    );
    if (as === "span") {
      return <span className={cls}>{children}</span>;
    }
    return (
      <button
        ref={ref}
        type="button"
        onPointerDown={(e) => {
          haptics.selection();
          onPointerDown?.(e);
        }}
        className={cls}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Chip.displayName = "Chip";
