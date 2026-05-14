import * as React from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  on?: boolean;
  as?: "button" | "span";
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, on = false, as = "button", children, ...props }, ref) => {
    const cls = cn(
      "inline-flex items-center justify-center rounded-full px-4 h-9",
      "font-sans text-[14px] font-medium tracking-tight",
      "border transition-colors duration-100 select-none",
      on
        ? "bg-ink text-paper border-ink"
        : "bg-white text-ink border-[#E8E6E1] hover:bg-[#FAF8F4]",
      className,
    );
    if (as === "span") {
      return <span className={cls}>{children}</span>;
    }
    return (
      <button ref={ref} type="button" className={cls} {...props}>
        {children}
      </button>
    );
  },
);
Chip.displayName = "Chip";
