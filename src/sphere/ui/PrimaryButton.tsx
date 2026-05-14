import * as React from "react";
import { cn } from "@/lib/utils";
import { haptics } from "@/mutual/native/haptics";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  arrow?: boolean;
  full?: boolean;
  /** Haptic intensity on press. Defaults to "medium" (commit-style). */
  haptic?: "light" | "medium" | "heavy" | "none";
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, children, arrow = true, full = true, haptic = "medium", onPointerDown, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      onPointerDown={(e) => {
        if (!disabled && haptic !== "none") haptics[haptic]();
        onPointerDown?.(e);
      }}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 rounded-full bg-ink text-paper",
        "h-14 px-7 font-sans text-[15px] font-medium tracking-tight",
        "transition-transform duration-100 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100",
        "select-none touch-manipulation",
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
