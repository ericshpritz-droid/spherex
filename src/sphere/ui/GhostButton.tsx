import * as React from "react";
import { cn } from "@/lib/utils";
import { haptics } from "@/mutual/native/haptics";

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  full?: boolean;
  haptic?: "light" | "medium" | "none";
}

export const GhostButton = React.forwardRef<HTMLButtonElement, GhostButtonProps>(
  ({ className, full = true, haptic = "light", onPointerDown, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      onPointerDown={(e) => {
        if (!disabled && haptic !== "none") haptics[haptic]();
        onPointerDown?.(e);
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-transparent text-ink",
        "h-14 px-7 font-sans text-[15px] font-medium tracking-tight",
        "border border-[#D8D5D0] transition-transform duration-100 active:scale-[0.97]",
        "disabled:opacity-40 disabled:active:scale-100 select-none touch-manipulation",
        full && "w-full",
        className,
      )}
      {...props}
    />
  ),
);
GhostButton.displayName = "GhostButton";
