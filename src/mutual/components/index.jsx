import React from 'react';
import { ACCENT_PRESETS } from '../brand.js';

export function LinkedRings({ size = 120, accent = 'pink', spin = false }) {
  const p = ACCENT_PRESETS[accent] || ACCENT_PRESETS.pink;
  return (
    <div style={{ width: size, height: size, position: 'relative', animation: spin ? 'mutualSpin 8s linear infinite' : undefined }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <defs>
          <linearGradient id={`lr-${accent}-a`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={p.a}/><stop offset="100%" stopColor={p.b}/>
          </linearGradient>
          <linearGradient id={`lr-${accent}-b`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={p.b}/><stop offset="100%" stopColor={p.c}/>
          </linearGradient>
        </defs>
        <circle cx="42" cy="60" r="30" fill="none" stroke={`url(#lr-${accent}-a)`} strokeWidth="8"/>
        <circle cx="78" cy="60" r="30" fill="none" stroke={`url(#lr-${accent}-b)`} strokeWidth="8"/>
      </svg>
    </div>
  );
}

export function Aura({ accent = 'pink', intensity = 1, style = {} }) {
  const p = ACCENT_PRESETS[accent] || ACCENT_PRESETS.pink;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', ...style }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-30%', width: '80%', height: '60%', borderRadius: '50%', background: p.a, filter: 'blur(80px)', opacity: 0.55 * intensity }}/>
      <div style={{ position: 'absolute', top: '30%', right: '-30%', width: '80%', height: '60%', borderRadius: '50%', background: p.c, filter: 'blur(80px)', opacity: 0.45 * intensity }}/>
      <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '70%', height: '50%', borderRadius: '50%', background: p.b, filter: 'blur(80px)', opacity: 0.35 * intensity }}/>
    </div>
  );
}

export function Wordmark({ size = 32, color = '#fff' }) {
  return (
    <div style={{
      fontFamily: 'Sora, system-ui', fontWeight: 800,
      fontSize: size, letterSpacing: size * -0.04,
      color, lineHeight: 1, display: 'flex', alignItems: 'center', gap: size * 0.08,
    }}>
      <span>mutua</span>
      <span style={{ position: 'relative', display: 'inline-block', width: size * 0.55 }}>
        l
        <span style={{ position: 'absolute', top: size * 0.05, right: size * -0.05, width: size * 0.22, height: size * 0.22, borderRadius: '50%', background: '#F13F5E' }}/>
      </span>
    </div>
  );
}

export function NumPad({ onKey }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 8 }}>
      {keys.map((k, i) => {
        if (k === '') return <div key={i}/>;
        return (
          <button key={i} onClick={() => onKey(k)} style={{
            height: 56, borderRadius: 18,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', cursor: 'pointer',
            fontFamily: 'Sora, system-ui', fontWeight: 600,
            fontSize: k === 'del' ? 18 : 26, letterSpacing: -0.4,
          }}>{k === 'del' ? '⌫' : k}</button>
        );
      })}
    </div>
  );
}

export function TabBar({ tab, setTab, accent }) {
  const tabs = [
    { id: 'home', label: 'Mutuals', icon: '◉' },
    { id: 'add',  label: 'Add',     icon: '+' },
    { id: 'me',   label: 'Me',      icon: '◐' },
  ];
  const p = ACCENT_PRESETS[accent] || ACCENT_PRESETS.pink;
  return (
    <div style={{
      position: 'absolute', bottom: 24, left: 16, right: 16, zIndex: 30,
      height: 64, borderRadius: 32,
      background: 'rgba(30,18,64,0.65)',
      backdropFilter: 'blur(24px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', padding: 6, boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, border: 'none', cursor: 'pointer',
            borderRadius: 26,
            background: active ? `linear-gradient(135deg, ${p.a} 0%, ${p.b} 50%, ${p.c} 100%)` : 'transparent',
            color: '#fff', fontFamily: 'Sora, system-ui',
            fontSize: 14, fontWeight: 600, letterSpacing: -0.1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: active ? `0 6px 16px ${p.a}55` : 'none',
          }}>
            <span style={{ fontSize: t.id === 'add' ? 22 : 16, lineHeight: 1 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
