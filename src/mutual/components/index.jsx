import React from 'react';
import { ACCENT_PRESETS } from '../brand.js';

export function LinkedRings({ size = 120, accent = 'pink', spin = false }) {
  const p = ACCENT_PRESETS[accent] || ACCENT_PRESETS.pink;
  return (
    <div
      className="relative"
      style={{ width: size, height: size, animation: spin ? 'mutualSpin 8s linear infinite' : undefined }}
    >
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={style}>
      <div className="absolute rounded-full" style={{ top: '-20%', left: '-30%', width: '80%', height: '60%', background: p.a, filter: 'blur(80px)', opacity: 0.55 * intensity }}/>
      <div className="absolute rounded-full" style={{ top: '30%', right: '-30%', width: '80%', height: '60%', background: p.c, filter: 'blur(80px)', opacity: 0.45 * intensity }}/>
      <div className="absolute rounded-full" style={{ bottom: '-20%', left: '10%', width: '70%', height: '50%', background: p.b, filter: 'blur(80px)', opacity: 0.35 * intensity }}/>
    </div>
  );
}

export function Wordmark({ size = 32, color = '#fff' }) {
  return (
    <div
      className="font-extrabold leading-none flex items-center"
      style={{ fontSize: size, letterSpacing: size * -0.04, color, gap: size * 0.08 }}
    >
      <span>mutua</span>
      <span className="relative inline-block" style={{ width: size * 0.55 }}>
        l
        <span
          className="absolute rounded-full"
          style={{ top: size * 0.05, right: size * -0.05, width: size * 0.22, height: size * 0.22, background: '#F13F5E' }}
        />
      </span>
    </div>
  );
}

export function NumPad({ onKey }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];
  return (
    <div className="grid grid-cols-3 gap-2.5 mb-2">
      {keys.map((k, i) => {
        if (k === '') return <div key={i}/>;
        return (
          <button
            key={i}
            onClick={() => onKey(k)}
            className="h-14 rounded-[18px] bg-glass-06 border border-hairline-10 text-white cursor-pointer font-semibold tracking-sora-tighter"
            style={{ fontSize: k === 'del' ? 18 : 26 }}
          >{k === 'del' ? '⌫' : k}</button>
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
    <div
      className="absolute bottom-6 left-4 right-4 z-30 h-16 rounded-full border border-hairline-08 flex p-1.5"
      style={{
        background: 'rgba(30,18,64,0.65)',
        backdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
      }}
    >
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 border-0 cursor-pointer rounded-[26px] text-white text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{
              background: active ? `linear-gradient(135deg, ${p.a} 0%, ${p.b} 50%, ${p.c} 100%)` : 'transparent',
              letterSpacing: -0.1,
              boxShadow: active ? `0 6px 16px ${p.a}55` : 'none',
            }}
          >
            <span className="leading-none" style={{ fontSize: t.id === 'add' ? 22 : 16 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
