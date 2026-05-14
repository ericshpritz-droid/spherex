import * as React from "react";
import { cn } from "@/lib/utils";

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  full?: boolean;
}

export const GhostButton = React.forwardRef<HTMLButtonElement, GhostButtonProps>(
  ({ className, full = true, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-transparent text-ink",
        "h-14 px-7 font-sans text-[15px] font-medium tracking-tight",
        "border border-[#D8D5D0] transition-transform duration-150 active:scale-[0.985] disabled:opacity-40",
        full && "w-full",
        className,
      )}
      {...props}
    />
  ),
);
GhostButton.displayName = "GhostButton";
