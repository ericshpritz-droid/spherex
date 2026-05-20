import * as React from "react";
import { cn } from "@/lib/utils";

interface SphereScreenProps {
  children: React.ReactNode;
  className?: string;
  /** When true, screen uses ink background instead of paper (for ceremonial / dark screens). */
  dark?: boolean;
}

/**
 * Phone-shell-aware screen wrapper for Sphere editorial UI.
 * Fills the parent (already a phone frame on web, full screen on native)
 * with the paper or ink background and provides safe horizontal padding.
 */
export function SphereScreen({ children, className, dark }: SphereScreenProps) {
  return (
    <div
      className={cn(
        "h-full w-full flex flex-col overflow-hidden font-sans",
        dark ? "text-paper" : "bg-paper text-ink",
        className,
      )}
      style={
        dark
          ? { backgroundColor: "#0A0A0A", color: "#F5F3EE" }
          : undefined
      }
    >
      {children}
    </div>
  );
}
