import React from 'react';
import { ACCENT_PRESETS } from '../brand.js';

export function Button({ children, onClick, variant = 'primary', accent = 'pink', disabled, full = true, style = {} }) {
  const p = ACCENT_PRESETS[accent] || ACCENT_PRESETS.pink;
  const base = {
    height: 56, borderRadius: 16, border: 'none',
    fontFamily: 'Sora, system-ui', fontWeight: 600, fontSize: 17,
    letterSpacing: -0.2, cursor: disabled ? 'default' : 'pointer',
    width: full ? '100%' : undefined, padding: full ? 0 : '0 24px',
    opacity: disabled ? 0.4 : 1, transition: 'transform 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...style,
  };
  if (variant === 'primary') {
    return (
      <button onClick={disabled ? undefined : onClick} style={{
        ...base, color: '#fff',
        background: `linear-gradient(135deg, ${p.a} 0%, ${p.b} 100%)`,
        boxShadow: `0 8px 24px ${p.a}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
      }}>{children}</button>
    );
  }
  if (variant === 'ghost') {
    return (
      <button onClick={disabled ? undefined : onClick} style={{
        ...base, color: '#fff',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.14)',
        backdropFilter: 'blur(20px)',
      }}>{children}</button>
    );
  }
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, color: '#120A32', background: '#fff' }}>
      {children}
    </button>
  );
}
