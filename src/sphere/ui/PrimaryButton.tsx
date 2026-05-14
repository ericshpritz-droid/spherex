import * as React from "react";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  arrow?: boolean;
  full?: boolean;
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, children, arrow = true, full = true, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 rounded-full bg-ink text-paper",
        "h-14 px-7 font-sans text-[15px] font-medium tracking-tight",
        "transition-transform duration-150 active:scale-[0.985] disabled:opacity-40",
        full && "w-full",
        className,
      )}
      {...props}
    >
      <span className="flex-1 text-left pl-2">{children}</span>
      {arrow && <span className="pr-2 text-[18px] leading-none translate-y-[-1px]">→</span>}
    </button>
  ),
);
PrimaryButton.displayName = "PrimaryButton";
