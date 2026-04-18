import React, { useState, useEffect } from 'react';
import { ACCENT_PRESETS, formatPhone, gradient } from '../brand.js';
import { Button } from '../components/Button.jsx';
import { PhoneAvatar } from '../components/PhoneAvatar.jsx';
import { LinkedRings, Aura, NumPad, Wordmark } from '../components/index.jsx';
import { CONTACTS } from '../data.js';

// ── Home header
function HomeHeader({ accent, matchCount }) {
  return (
    <div style={{ padding: '72px 24px 12px' }}>
      <div className="flex items-center justify-between">
        <Wordmark size={28} color="#fff"/>
        <div className="w-10 h-10 rounded-full bg-glass-08 border border-hairline-10 flex items-center justify-center text-lg">🔔</div>
      </div>
      <div className="mt-7">
        <div className="text-[13px] font-medium text-fg-55 tracking-sora-label uppercase">Your mutuals</div>
        <div
          className="mt-1.5 font-extrabold tracking-sora-giant"
          style={{
            fontSize: 64, lineHeight: 1,
            background: gradient(accent, '135deg'),
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}
        >{matchCount}</div>
      </div>
    </div>
  );
}

function PendingRow({ person, accent }) {
  return (
    <div className="rounded-[18px] bg-glass-04 border border-hairline-06 flex items-center gap-3.5" style={{ padding: '14px 16px' }}>
      <PhoneAvatar phone={person.phone} size={44} accent={person.avatar}/>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-white tracking-sora-tight">{person.unknown ? person.phone : person.name}</div>
        <div className="text-[13px] text-fg-50 flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: ACCENT_PRESETS[accent].b, animation: 'mutualPulse 1.8s ease-in-out infinite' }}
          />
          Waiting
        </div>
      </div>
      <div className="text-lg text-fg-30">⋯</div>
    </div>
  );
}

export function ScreenHome({ accent, matches, pending, onOpenMatch, onAdd, variant = 'cards' }) {
  if (matches.length === 0 && pending.length === 0) {
    return (
      <div className="h-full bg-ink text-white relative overflow-auto pb-[120px]">
        <Aura accent={accent} intensity={0.5}/>
        <div className="relative z-[1]">
          <HomeHeader accent={accent} matchCount={0}/>
          <div className="rounded-[28px] bg-glass-04 text-center" style={{ margin: '40px 24px', padding: 32, border: '1px dashed rgba(255,255,255,0.12)' }}>
            <div className="flex justify-center mb-5">
              <LinkedRings size={96} accent={accent}/>
            </div>
            <div className="font-bold text-[22px]">Nothing mutual yet</div>
            <div className="mt-2 text-sm text-fg-60" style={{ lineHeight: 1.4 }}>
              Add a number. If they've added yours,<br/>it'll light up here.
            </div>
            <div className="mt-5"><Button accent={accent} onClick={onAdd} full={false}>+ Add first number</Button></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-ink text-white overflow-auto relative pb-[120px]">
      <Aura accent={accent} intensity={0.5}/>
      <div className="relative z-[1]">
        <HomeHeader accent={accent} matchCount={matches.length}/>
        <div style={{ padding: '16px 24px 0' }}>
          <div className="text-[15px] font-semibold mb-3">Matched</div>
          <div className="flex gap-3 overflow-x-auto" style={{ margin: '0 -24px', padding: '0 24px 12px' }}>
            {matches.map((m, i) => (
              <div
                key={i}
                onClick={() => onOpenMatch(m)}
                className="rounded-3xl text-white cursor-pointer relative overflow-hidden"
                style={{
                  minWidth: 220, padding: 20,
                  background: gradient(i % 2 === 0 ? accent : (accent === 'pink' ? 'lavender' : 'pink'), '160deg'),
                  boxShadow: '0 12px 32px rgba(241,63,94,0.25)',
                }}
              >
                <div className="absolute rounded-full" style={{ top: -40, right: -30, width: 140, height: 140, background: 'rgba(255,255,255,0.18)' }}/>
                <div
                  className="absolute font-semibold rounded-lg"
                  style={{ top: 12, right: 16, fontSize: 11, padding: '4px 8px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}
                >{m.matchedAt}</div>
                <PhoneAvatar phone={m.phone} size={56} accent={m.avatar} style={{ marginBottom: 20, position: 'relative' }}/>
                <div className="font-bold tracking-sora-tighter relative" style={{ fontSize: 20 }}>{m.name}</div>
                <div className="text-sm text-fg-75 relative">{m.phone}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '28px 24px 0' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[15px] font-semibold">Pending · {pending.length}</div>
            <div className="text-[13px] text-fg-55">They haven't added you back yet</div>
          </div>
          <div className="flex flex-col gap-2">
            {pending.map((p, i) => <PendingRow key={i} person={p} accent={accent}/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScreenAdd({ accent, onSubmit, onBack, onBrowseContacts }) {
  const [digits, setDigits] = useState('');
  const valid = digits.length === 10;
  return (
    <div className="relative h-full overflow-hidden bg-ink text-white">
      <Aura accent={accent} intensity={0.5}/>
      <div className="relative z-[1] h-full flex flex-col" style={{ padding: '72px 24px 40px' }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full border-0 bg-glass-08 text-white text-lg cursor-pointer">←</button>
          <div className="font-bold text-[22px]">Add a number</div>
        </div>
        <div className="rounded-[18px] bg-glass-04 border border-hairline-10 mb-4" style={{ padding: 18 }}>
          <div className="text-xs font-semibold text-fg-50 uppercase mb-2.5" style={{ letterSpacing: 0.4 }}>Their phone</div>
          <div className="flex items-center gap-3">
            <div className="font-semibold text-xl text-fg-50">🇺🇸 +1</div>
            <div className="w-px bg-hairline-12" style={{ height: 22 }}/>
            <div className="flex-1 font-semibold text-white tracking-sora-tighter" style={{ fontSize: 22 }}>
              {formatPhone(digits) || <span className="text-fg-25">(555) 000-0000</span>}
            </div>
          </div>
        </div>
        <div
          className="rounded-[14px] mb-4 flex gap-2.5"
          style={{ padding: 14, background: `${ACCENT_PRESETS[accent].a}12`, border: `1px solid ${ACCENT_PRESETS[accent].a}30` }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center font-extrabold shrink-0"
            style={{ background: gradient(accent, '135deg') }}
          >i</div>
          <div className="text-[13px] text-fg-85" style={{ lineHeight: 1.45 }}>
            They'll never know you added them — unless they add you back. Then it's mutual.
          </div>
        </div>
        <button
          onClick={onBrowseContacts}
          className="rounded-[14px] bg-glass-06 border border-hairline-10 text-white cursor-pointer flex items-center gap-3 text-[15px] font-medium mb-auto"
          style={{ padding: '14px 16px' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: gradient(accent), fontSize: 16 }}
          >📇</div>
          <div className="flex-1 text-left">
            <div>Pick from contacts</div>
            <div className="text-xs text-fg-50 font-normal">We only use hashes — never upload raw</div>
          </div>
          <span className="text-fg-40">›</span>
        </button>
        <NumPad onKey={(k) => {
          if (k === 'del') setDigits(d => d.slice(0, -1));
          else if (digits.length < 10) setDigits(d => d + k);
        }}/>
        <div className="mt-3.5">
          <Button accent={accent} disabled={!valid} onClick={() => onSubmit(digits)}>
            {valid ? 'Add them' : 'Enter 10 digits'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ScreenContacts({ accent, onBack, onPick }) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState(new Set());
  const filtered = CONTACTS.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
  const toggle = (phone) => {
    const s = new Set(picked); s.has(phone) ? s.delete(phone) : s.add(phone); setPicked(s);
  };
  const groups = {};
  filtered.forEach(c => { const k = c.name[0].toUpperCase(); (groups[k] = groups[k] || []).push(c); });
  const letters = Object.keys(groups).sort();
  return (
    <div className="relative h-full overflow-hidden bg-ink text-white flex flex-col">
      <Aura accent={accent} intensity={0.4}/>
      <div className="relative z-[1]" style={{ padding: '72px 20px 12px' }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full border-0 bg-glass-08 text-white text-lg cursor-pointer">←</button>
          <div className="flex-1">
            <div className="font-bold text-xl">Your contacts</div>
            <div className="text-xs text-fg-50">{CONTACTS.length} people · pick as many as you want</div>
          </div>
        </div>
        <div className="rounded-[14px] bg-glass-06 border border-hairline-08 flex items-center gap-2.5" style={{ padding: '12px 16px' }}>
          <span className="text-fg-40">🔍</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search name or number"
            className="flex-1 bg-transparent border-0 outline-none text-white text-[15px]"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto relative z-[1] pb-[140px]">
        {letters.map(L => (
          <div key={L}>
            <div
              className="font-bold tracking-sora-caps"
              style={{ padding: '14px 24px 4px', fontSize: 11, color: ACCENT_PRESETS[accent].b }}
            >{L}</div>
            {groups[L].map(c => {
              const on = picked.has(c.phone);
              return (
                <div
                  key={c.phone}
                  onClick={() => toggle(c.phone)}
                  className="flex items-center gap-3 cursor-pointer rounded-[14px]"
                  style={{
                    margin: '0 16px 4px', padding: '10px 12px',
                    background: on ? `${ACCENT_PRESETS[accent].a}18` : 'transparent',
                    border: on ? `1px solid ${ACCENT_PRESETS[accent].a}60` : '1px solid transparent',
                  }}
                >
                  <PhoneAvatar phone={c.phone} size={40} accent={c.avatar}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold">{c.name}</div>
                    <div className="text-[13px] text-fg-50">{c.phone}</div>
                  </div>
                  <div
                    className="flex items-center justify-center text-white font-extrabold"
                    style={{
                      width: 26, height: 26, borderRadius: 13,
                      border: on ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
                      background: on ? gradient(accent) : 'transparent',
                      fontSize: 14,
                    }}
                  >{on && '✓'}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {picked.size > 0 && (
        <div className="absolute bottom-6 left-4 right-4 z-30">
          <Button accent={accent} onClick={() => onPick([...picked])}>
            Add {picked.size} {picked.size === 1 ? 'person' : 'people'}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ScreenSent({ accent, phone, onDone }) {
  return (
    <div className="relative h-full overflow-hidden bg-ink text-white">
      <Aura accent={accent} intensity={0.8}/>
      <div className="relative z-[1] h-full flex flex-col items-center justify-center text-center" style={{ padding: 32 }}>
        <div className="relative mb-8">
          <LinkedRings size={160} accent={accent} spin/>
          <div className="absolute inset-0 flex items-center justify-center font-extrabold text-white text-xl">
            {String(phone).slice(-4) || '••'}
          </div>
        </div>
        <div className="font-bold tracking-sora-display" style={{ fontSize: 28, lineHeight: 1.1, letterSpacing: -1 }}>Added. Now we wait.</div>
        <div className="mt-3.5 text-[15px] text-fg-65" style={{ lineHeight: 1.45, maxWidth: 280 }}>
          If they add your number, you'll both get the notification. Until then — total silence.
        </div>
        <div className="mt-9 w-full" style={{ maxWidth: 320 }}>
          <Button accent={accent} onClick={onDone}>Okay</Button>
        </div>
      </div>
    </div>
  );
}

export function ScreenMatchReveal({ accent, match, onBack, onClose, variant = 'burst' }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (variant !== 'burst') return;
    let raf, start = performance.now();
    const loop = (ts) => { setT((ts - start) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [variant]);

  if (variant === 'calm') {
    return (
      <div className="relative h-full overflow-hidden bg-ink text-white">
        <Aura accent={accent} intensity={0.9}/>
        <div className="relative z-[1] h-full flex flex-col" style={{ padding: '72px 28px 40px' }}>
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full border-0 bg-glass-08 text-white text-lg cursor-pointer self-start"
          >✕</button>
          <div className="flex-1 flex flex-col justify-center">
            <div
              className="font-semibold uppercase tracking-sora-eyebrow"
              style={{ fontSize: 12, color: ACCENT_PRESETS[accent].b }}
            >Mutual · just now</div>
            <div className="mt-4 font-bold tracking-sora-mega" style={{ fontSize: 46, lineHeight: 1 }}>
              You both<br/>picked each<br/>other.
            </div>
            <div className="mt-8 rounded-3xl bg-glass-06 border border-hairline-10" style={{ padding: 20 }}>
              <div className="flex items-center gap-3.5">
                <PhoneAvatar phone={match?.phone || '415'} size={56} accent={match?.avatar || 'pink'}/>
                <div className="flex-1">
                  <div className="font-bold text-xl">{match?.name || 'Ava Chen'}</div>
                  <div className="text-sm text-fg-60">{match?.phone || '(415) 555-0192'}</div>
                </div>
              </div>
              <div
                className="mt-4 rounded-xl text-[13px]"
                style={{
                  padding: '12px 14px', lineHeight: 1.4,
                  background: `${ACCENT_PRESETS[accent].a}18`,
                  border: `1px solid ${ACCENT_PRESETS[accent].a}30`,
                }}
              >
                You added them <b className="text-white">2 days ago</b>. They just added you back.
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <Button accent={accent} onClick={onClose}>Open text thread</Button>
            <Button variant="ghost" onClick={onBack}>Later</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-ink text-white">
      <Aura accent={accent} intensity={1.3}/>
      {[0, 0.5, 1].map(delay => {
        const phase = ((t + delay) % 2) / 2;
        return (
          <div
            key={delay}
            className="absolute rounded-full pointer-events-none"
            style={{
              top: '40%', left: '50%',
              width: 40 + phase * 600, height: 40 + phase * 600,
              transform: 'translate(-50%, -50%)',
              border: `2px solid ${ACCENT_PRESETS[accent].a}`,
              opacity: (1 - phase) * 0.5,
            }}
          />
        );
      })}
      <div className="relative z-[2] h-full flex flex-col" style={{ padding: '72px 32px 48px' }}>
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full border-0 bg-glass-10 text-white text-lg cursor-pointer self-start"
        >✕</button>
        <div className="flex-1 flex flex-col justify-center text-center">
          <div
            className="font-semibold uppercase tracking-sora-eyebrow mb-4"
            style={{ fontSize: 14, color: ACCENT_PRESETS[accent].b }}
          >It's mutual</div>
          <div
            className="font-extrabold tracking-sora-giant"
            style={{
              fontSize: 72, lineHeight: 0.95,
              background: gradient(accent, '135deg'),
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}
          >
            {(match?.name || 'Ava Chen').split(' ')[0]}<br/>picked<br/>you back.
          </div>
          <div className="mt-10 flex justify-center items-center gap-5">
            <PhoneAvatar phone="you" size={72} accent="pink"/>
            <div style={{ fontSize: 32, color: ACCENT_PRESETS[accent].a, animation: 'mutualPulse 1.2s ease-in-out infinite' }}>♡</div>
            <PhoneAvatar phone={match?.phone || '415'} size={72} accent="lavender"/>
          </div>
          <div className="mt-7 text-[15px] text-fg-70">{match?.phone || '(415) 555-0192'}</div>
        </div>
        <div className="flex flex-col gap-2.5">
          <Button accent={accent} onClick={onClose}>Text {(match?.name || 'them').split(' ')[0]}</Button>
          <Button variant="ghost" onClick={onBack}>Keep it cool</Button>
        </div>
      </div>
    </div>
  );
}

export function ScreenProfile({ accent, onAccent, phone, onSignOut }) {
  const displayPhone = phone || '—';
  const Row = ({ label, value, last, onClick, danger }) => (
    <div
      onClick={onClick}
      className="flex justify-between"
      style={{
        padding: '14px 18px',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div className={`text-[15px] font-medium ${danger ? 'text-error' : 'text-white'}`}>{label}</div>
      <div className="text-sm text-fg-50">{value}</div>
    </div>
  );
  const Section = ({ title, children }) => (
    <div className="mb-6">
      <div className="font-semibold text-fg-45 uppercase tracking-sora-caps" style={{ padding: '0 24px 8px', fontSize: 11 }}>{title}</div>
      <div className="rounded-[20px] bg-glass-04 border border-hairline-06 overflow-hidden mx-4">{children}</div>
    </div>
  );
  return (
    <div className="relative h-full overflow-auto bg-ink text-white pb-[120px]">
      <Aura accent={accent} intensity={0.4}/>
      <div className="relative z-[1]">
        <div className="text-center" style={{ padding: '72px 24px 24px' }}>
          <div className="inline-block mb-3">
            <PhoneAvatar phone={displayPhone} size={84} accent={accent}/>
          </div>
          <div className="font-bold text-[22px]">{displayPhone}</div>
          <div className="text-[13px] text-fg-50 mt-1">Signed in</div>
        </div>
        <Section title="Accent hue">
          <div className="flex gap-2.5" style={{ padding: 16 }}>
            {['pink', 'lavender', 'blue'].map(a => (
              <button
                key={a}
                onClick={() => onAccent(a)}
                className="flex-1 rounded-[14px] cursor-pointer text-white font-semibold capitalize"
                style={{
                  height: 60, fontSize: 13,
                  background: gradient(a, '135deg'),
                  border: accent === a ? '2px solid #fff' : '2px solid transparent',
                  boxShadow: accent === a ? `0 8px 24px ${ACCENT_PRESETS[a].a}60` : 'none',
                }}
              >{a}</button>
            ))}
          </div>
        </Section>
        <Section title="Privacy">
          <Row label="Your number" value={displayPhone}/>
          <Row label="Visible to" value="No one" last/>
        </Section>
        <Section title="Account">
          <Row label="Sign out" value="→" last danger onClick={onSignOut}/>
        </Section>
      </div>
    </div>
  );
}
