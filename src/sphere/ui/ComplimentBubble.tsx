import * as React from "react";
import { cn } from "@/lib/utils";

interface ComplimentBubbleProps {
  body: React.ReactNode;
  caption?: string;
  className?: string;
}

export function ComplimentBubble({ body, caption, className }: ComplimentBubbleProps) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-ink text-paper px-6 py-5",
        "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      <div className="font-serif italic text-[22px] leading-[1.25]">{body}</div>
      {caption && (
        <div
          className="mt-3 font-mono text-[10px] uppercase text-paper/55"
          style={{ letterSpacing: "0.22em" }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}
