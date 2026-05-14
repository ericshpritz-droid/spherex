import * as React from "react";
import { cn } from "@/lib/utils";
import { normalizeNanp, formatNanp } from "@/mutual/phone/nanp";

// Display the in-progress NANP number with a space-separated grouping
// (`555 123 4567`) — matches the placeholder style and avoids the parens
// inside the input field. Validation lives in @/mutual/phone/nanp.
function formatUS(digits: string) {
  const d = normalizeNanp(digits);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}
// Re-exported for callers that want the parenthesized display form.
export { formatNanp };

interface PhoneFieldProps {
  value: string;
  onChange: (digits: string) => void;
  countryCode?: string;
  flag?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function PhoneField({
  value,
  onChange,
  countryCode = "+1",
  flag = "🇺🇸",
  placeholder = "555 123 4567",
  autoFocus,
  className,
}: PhoneFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-white border border-line",
        "h-16 px-4",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 pr-3 border-r border-line h-8">
        <span className="text-[18px] leading-none">{flag}</span>
        <span className="font-sans text-[15px] text-ink font-medium">{countryCode}</span>
      </div>
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        autoFocus={autoFocus}
        value={formatUS(value)}
        onChange={(e) => onChange(normalizeNanp(e.target.value))}
        placeholder={placeholder}
        className="flex-1 bg-transparent font-sans text-[17px] text-ink placeholder:text-mute outline-none border-0"
      />
    </div>
  );
}
