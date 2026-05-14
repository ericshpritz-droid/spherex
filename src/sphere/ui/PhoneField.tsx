import * as React from "react";
import { cn } from "@/lib/utils";

interface PhoneFieldProps {
  value: string;
  onChange: (digits: string) => void;
  countryCode?: string;
  flag?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

function formatUS(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
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
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        placeholder={placeholder}
        className="flex-1 bg-transparent font-sans text-[17px] text-ink placeholder:text-mute outline-none border-0"
      />
    </div>
  );
}
