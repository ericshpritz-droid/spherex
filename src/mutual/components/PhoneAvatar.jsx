import React from 'react';
import { ACCENT_PRESETS } from '../lib/brand.js';

export function PhoneAvatar({ phone, size = 44, accent, style = {} }) {
  const hash = String(phone).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hues = ['pink', 'lavender', 'blue'];
  const a = accent || hues[hash % hues.length];
  const p = ACCENT_PRESETS[a];
  const last = String(phone).replace(/\D/g, '').slice(-2) || '••';
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32,
      background: `linear-gradient(140deg, ${p.a}, ${p.c})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Sora, system-ui', fontWeight: 700,
      fontSize: size * 0.38, color: '#fff',
      boxShadow: `0 4px 12px ${p.a}40`,
      flexShrink: 0, ...style,
    }}>{last}</div>
  );
}
