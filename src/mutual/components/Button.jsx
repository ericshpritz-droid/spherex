import React from 'react';
import { ACCENT_PRESETS } from '../brand.js';
import { haptics } from '../native/haptics';

export function Button({ children, onClick, variant = 'primary', accent = 'pink', disabled, full = true, style = {} }) {
  const handleClick = disabled
    ? undefined
    : (e) => {
        haptics.light();
        onClick?.(e);
      };
  const p = ACCENT_PRESETS[accent] || ACCENT_PRESETS.pink;
  const baseClass = [
    'h-14 rounded-2xl border-0 font-semibold text-[17px] tracking-sora-tight',
    'flex items-center justify-center gap-2 transition-transform duration-150',
    full ? 'w-full p-0' : 'w-auto px-6',
    disabled ? 'opacity-40 cursor-default' : 'cursor-pointer',
  ].join(' ');

  if (variant === 'primary') {
    return (
      <button
        onClick={handleClick}
        className={`${baseClass} text-white`}
        style={{
          background: `linear-gradient(135deg, ${p.a} 0%, ${p.b} 100%)`,
          boxShadow: `0 8px 24px ${p.a}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
          ...style,
        }}
      >{children}</button>
    );
  }
  if (variant === 'ghost') {
    return (
      <button
        onClick={handleClick}
        className={`${baseClass} text-white bg-glass-08 border border-hairline-14 backdrop-blur-xl`}
        style={style}
      >{children}</button>
    );
  }
  return (
    <button
      onClick={handleClick}
      className={`${baseClass} bg-white`}
      style={{ color: '#120A32', ...style }}
    >{children}</button>
  );
}
