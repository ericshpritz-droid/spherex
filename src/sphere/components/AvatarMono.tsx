import { cn } from "@/lib/utils";

interface AvatarMonoProps {
  /** Two-letter initials, e.g. "AP" */
  initials: string;
  size?: number;
  className?: string;
}

/** B&W ink-filled circular avatar with serif initials. */
export function AvatarMono({ initials, size = 44, className }: AvatarMonoProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-ink text-paper flex items-center justify-center shrink-0",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span
        className="font-sans font-medium tracking-tight"
        style={{ fontSize: Math.round(size * 0.36) }}
      >
        {initials.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

export function initialsFromHash(hash: string): string {
  // Map 2 hex characters → 2 letters A–Z deterministically.
  const a = parseInt(hash.slice(0, 2) || "0", 16) % 26;
  const b = parseInt(hash.slice(2, 4) || "0", 16) % 26;
  return String.fromCharCode(65 + a) + String.fromCharCode(65 + b);
}
