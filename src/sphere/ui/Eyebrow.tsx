import * as React from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "font-mono text-[11px] uppercase text-mute",
        className,
      )}
      style={{ letterSpacing: "0.22em", ...(props.style || {}) }}
      {...props}
    >
      {children}
    </div>
  );
}
