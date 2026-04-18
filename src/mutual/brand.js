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

export function formatPhone(digits) {
  const d = String(digits).replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
