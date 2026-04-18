import React from 'react';
import { ACCENT_PRESETS } from '../brand.js';

export function Spinner({ accent = 'pink', size = 36 }) {
  const c = ACCENT_PRESETS[accent]?.a || '#F13F5E';
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        width: size, height: size,
        borderRadius: '50%',
        border: `3px solid rgba(255,255,255,0.12)`,
        borderTopColor: c,
        animation: 'mutualSpin 0.9s linear infinite',
      }}
    />
  );
}
