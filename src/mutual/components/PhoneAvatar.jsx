import React from 'react';
import { ACCENT_PRESETS } from '../brand.js';

export function PhoneAvatar({ phone, size = 44, accent, style = {}, photoUrl = null }) {
  const hash = String(phone).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hues = ['pink', 'lavender', 'blue'];
  const a = accent || hues[hash % hues.length];
  const p = ACCENT_PRESETS[a];
  const last = String(phone).replace(/\D/g, '').slice(-2) || '••';
  const radius = size * 0.32;

  // If we have a real contact photo (only on native iOS via Capacitor Contacts),
  // render it with the same rounded-square shape so the layout doesn't shift.
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="shrink-0 object-cover"
        style={{
          width: size, height: size, borderRadius: radius,
          boxShadow: `0 4px 12px ${p.a}40`,
          ...style,
        }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center font-bold text-white shrink-0"
      style={{
        width: size, height: size, borderRadius: radius,
        background: `linear-gradient(140deg, ${p.a}, ${p.c})`,
        fontSize: size * 0.38,
        boxShadow: `0 4px 12px ${p.a}40`,
        ...style,
      }}
    >{last}</div>
  );
}
