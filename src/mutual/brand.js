// Mutual — design tokens

export const BRAND = {
  pink: '#F13F5E',
  rose: '#F17296',
  lavender: '#B08AFC',
  blue: '#5B7BFF',
  ink: '#120A32',
  inkDeep: '#08041C',
  inkCard: '#1E1240',
};

export const ACCENT_PRESETS = {
  pink:     { a: '#F13F5E', b: '#F17296', c: '#B08AFC' },
  lavender: { a: '#B08AFC', b: '#9572F0', c: '#5B7BFF' },
  blue:     { a: '#5B7BFF', b: '#8A6BF0', c: '#F17296' },
};

export function gradient(accent = 'pink', dir = '135deg') {
  const p = ACCENT_PRESETS[accent] || ACCENT_PRESETS.pink;
  return `linear-gradient(${dir}, ${p.a} 0%, ${p.b} 50%, ${p.c} 100%)`;
}

// Re-exported NANP formatter so existing `import { formatPhone } from
// '../brand.js'` call sites keep working. The canonical implementation lives
// in src/mutual/phone/nanp.ts — see that file for the rules.
export { formatNanp as formatPhone } from './phone/nanp';
