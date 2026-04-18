import React, { useState, useEffect } from 'react';
import { BRAND, ACCENT_PRESETS, formatPhone, gradient } from '../brand.js';
import { Button } from '../components/Button.jsx';
import { PhoneAvatar } from '../components/PhoneAvatar.jsx';
import { LinkedRings, Aura, NumPad, Wordmark } from '../components/index.jsx';
import { CONTACTS } from '../data.js';

// ── Home header
function HomeHeader({ accent, matchCount }) {
  return (
    <div style={{ padding: '72px 24px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Wordmark size={28} color="#fff"/>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔔</div>
      </div>
      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: 'Sora, system-ui', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Your mutuals</div>
        <div style={{ marginTop: 6, fontFamily: 'Sora, system-ui', fontWeight: 800, fontSize: 64, lineHeight: 1, letterSpacing: -3, background: gradient(accent, '135deg'), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{matchCount}</div>
      </div>
    </div>
  );
}

function PendingRow({ person, accent }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <PhoneAvatar phone={person.phone} size={44} accent={person.avatar}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Sora, system-ui', fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: -0.2 }}>{person.unknown ? person.phone : person.name}</div>
        <div style={{ fontFamily: 'Sora, system-ui', fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: ACCENT_PRESETS[accent].b, animation: 'mutualPulse 1.8s ease-in-out infinite' }}/>
          Waiting
        </div>
      </div>
      <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }}>⋯</div>
    </div>
  );
}

export function ScreenHome({ accent, matches, pending, onOpenMatch, onAdd, variant = 'cards' }) {
  if (matches.length === 0 && pending.length === 0) {
    return (
      <div style={{ paddingBottom: 120, height: '100%', background: BRAND.ink, color: '#fff', position: 'relative', overflow: 'auto' }}>
        <Aura accent={accent} intensity={0.5}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <HomeHeader accent={accent} matchCount={0}/>
          <div style={{ margin: '40px 24px', padding: 32, borderRadius: 28, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <LinkedRings size={96} accent={accent}/>
            </div>
            <div style={{ fontFamily: 'Sora, system-ui', fontWeight: 700, fontSize: 22 }}>Nothing mutual yet</div>
            <div style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
              Add a number. If they've added yours,<br/>it'll light up here.
            </div>
            <div style={{ marginTop: 20 }}><Button accent={accent} onClick={onAdd} full={false}>+ Add first number</Button></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 120, height: '100%', background: BRAND.ink, color: '#fff', overflow: 'auto', position: 'relative' }}>
      <Aura accent={accent} intensity={0.5}/>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HomeHeader accent={accent} matchCount={matches.length}/>
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ fontFamily: 'Sora, system-ui', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Matched</div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', margin: '0 -24px', padding: '0 24px 12px' }}>
            {matches.map((m, i) => (
              <div key={i} onClick={() => onOpenMatch(m)} style={{
                minWidth: 220, padding: 20, borderRadius: 24,
                background: gradient(i % 2 === 0 ? accent : (accent === 'pink' ? 'lavender' : 'pink'), '160deg'),
                color: '#fff', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(241,63,94,0.25)',
              }}>
                <div style={{ position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }}/>
                <div style={{ position: 'absolute', top: 12, right: 16, fontFamily: 'Sora, system-ui', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>{m.matchedAt}</div>
                <PhoneAvatar phone={m.phone} size={56} accent={m.avatar} style={{ marginBottom: 20, position: 'relative' }}/>
                <div style={{ fontFamily: 'Sora, system-ui', fontSize: 20, fontWeight: 700, letterSpacing: -0.5, position: 'relative' }}>{m.name}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', position: 'relative' }}>{m.phone}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '28px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Sora, system-ui', fontSize: 15, fontWeight: 600 }}>Pending · {pending.length}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>They haven't added you back yet</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
    <div style={{ position: 'relative', height: '100%', color: '#fff', overflow: 'hidden', background: BRAND.ink }}>
      <Aura accent={accent} intensity={0.5}/>
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', padding: '72px 24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ fontFamily: 'Sora, system-ui', fontWeight: 700, fontSize: 22 }}>Add a number</div>
        </div>
        <div style={{ padding: 18, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Their phone</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 20, color: 'rgba(255,255,255,0.5)' }}>🇺🇸 +1</div>
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.12)' }}/>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 22, color: '#fff', letterSpacing: -0.5 }}>
              {formatPhone(digits) || <span style={{ color: 'rgba(255,255,255,0.25)' }}>(555) 000-0000</span>}
            </div>
          </div>
        </div>
        <div style={{ padding: 14, borderRadius: 14, background: `${ACCENT_PRESETS[accent].a}12`, border: `1px solid ${ACCENT_PRESETS[accent].a}30`, marginBottom: 16, display: 'flex', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: gradient(accent, '135deg'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>i</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>
            They'll never know you added them — unless they add you back. Then it's mutual.
          </div>
        </div>
        <button onClick={onBrowseContacts} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 500, marginBottom: 'auto' }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: gradient(accent), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📇</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div>Pick from contacts</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>We only use hashes — never upload raw</div>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>›</span>
        </button>
        <NumPad onKey={(k) => {
          if (k === 'del') setDigits(d => d.slice(0, -1));
          else if (digits.length < 10) setDigits(d => d + k);
        }}/>
        <div style={{ marginTop: 14 }}>
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
    <div style={{ position: 'relative', height: '100%', color: '#fff', overflow: 'hidden', background: BRAND.ink, display: 'flex', flexDirection: 'column' }}>
      <Aura accent={accent} intensity={0.4}/>
      <div style={{ position: 'relative', zIndex: 1, padding: '72px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 18, cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Sora, system-ui', fontWeight: 700, fontSize: 20 }}>Your contacts</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{CONTACTS.length} people · pick as many as you want</div>
          </div>
        </div>
        <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or number" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 15 }}/>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, paddingBottom: 140 }}>
        {letters.map(L => (
          <div key={L}>
            <div style={{ padding: '14px 24px 4px', fontSize: 11, fontWeight: 700, color: ACCENT_PRESETS[accent].b, letterSpacing: 1.5 }}>{L}</div>
            {groups[L].map(c => {
              const on = picked.has(c.phone);
              return (
                <div key={c.phone} onClick={() => toggle(c.phone)} style={{
                  margin: '0 16px 4px', padding: '10px 12px', borderRadius: 14,
                  background: on ? `${ACCENT_PRESETS[accent].a}18` : 'transparent',
                  border: on ? `1px solid ${ACCENT_PRESETS[accent].a}60` : '1px solid transparent',
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                }}>
                  <PhoneAvatar phone={c.phone} size={40} accent={c.avatar}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{c.phone}</div>
                  </div>
                  <div style={{ width: 26, height: 26, borderRadius: 13, border: on ? 'none' : '1.5px solid rgba(255,255,255,0.25)', background: on ? gradient(accent) : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800 }}>{on && '✓'}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {picked.size > 0 && (
        <div style={{ position: 'absolute', bottom: 24, left: 16, right: 16, zIndex: 30 }}>
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
    <div style={{ position: 'relative', height: '100%', color: '#fff', overflow: 'hidden', background: BRAND.ink }}>
      <Aura accent={accent} intensity={0.8}/>
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <LinkedRings size={160} accent={accent} spin/>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, system-ui', fontWeight: 800, fontSize: 20, color: '#fff' }}>{String(phone).slice(-4) || '••'}</div>
        </div>
        <div style={{ fontFamily: 'Sora, system-ui', fontWeight: 700, fontSize: 28, letterSpacing: -1, lineHeight: 1.1 }}>Added. Now we wait.</div>
        <div style={{ marginTop: 14, fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.45, maxWidth: 280 }}>
          If they add your number, you'll both get the notification. Until then — total silence.
        </div>
        <div style={{ marginTop: 36, width: '100%', maxWidth: 320 }}>
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
      <div style={{ position: 'relative', height: '100%', color: '#fff', overflow: 'hidden', background: BRAND.ink }}>
        <Aura accent={accent} intensity={0.9}/>
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', padding: '72px 28px 40px' }}>
          <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 18, cursor: 'pointer', alignSelf: 'flex-start' }}>✕</button>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: ACCENT_PRESETS[accent].b, letterSpacing: 3, textTransform: 'uppercase' }}>Mutual · just now</div>
            <div style={{ marginTop: 16, fontFamily: 'Sora, system-ui', fontWeight: 700, fontSize: 46, lineHeight: 1, letterSpacing: -2 }}>
              You both<br/>picked each<br/>other.
            </div>
            <div style={{ marginTop: 32, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <PhoneAvatar phone={match?.phone || '415'} size={56} accent={match?.avatar || 'pink'}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 20 }}>{match?.name || 'Ava Chen'}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{match?.phone || '(415) 555-0192'}</div>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: `${ACCENT_PRESETS[accent].a}18`, border: `1px solid ${ACCENT_PRESETS[accent].a}30`, fontSize: 13, lineHeight: 1.4 }}>
                You added them <b style={{ color: '#fff' }}>2 days ago</b>. They just added you back.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button accent={accent} onClick={onClose}>Open text thread</Button>
            <Button variant="ghost" onClick={onBack}>Later</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', color: '#fff', overflow: 'hidden', background: BRAND.ink }}>
      <Aura accent={accent} intensity={1.3}/>
      {[0, 0.5, 1].map(delay => {
        const phase = ((t + delay) % 2) / 2;
        return (
          <div key={delay} style={{
            position: 'absolute', top: '40%', left: '50%',
            width: 40 + phase * 600, height: 40 + phase * 600,
            borderRadius: '50%', transform: 'translate(-50%, -50%)',
            border: `2px solid ${ACCENT_PRESETS[accent].a}`,
            opacity: (1 - phase) * 0.5, pointerEvents: 'none',
          }}/>
        );
      })}
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', padding: '72px 32px 48px' }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 18, cursor: 'pointer', alignSelf: 'flex-start' }}>✕</button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: ACCENT_PRESETS[accent].b, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>It's mutual</div>
          <div style={{ fontFamily: 'Sora, system-ui', fontWeight: 800, fontSize: 72, lineHeight: 0.95, letterSpacing: -3, background: gradient(accent, '135deg'), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {(match?.name || 'Ava Chen').split(' ')[0]}<br/>picked<br/>you back.
          </div>
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
            <PhoneAvatar phone="you" size={72} accent="pink"/>
            <div style={{ fontSize: 32, color: ACCENT_PRESETS[accent].a, animation: 'mutualPulse 1.2s ease-in-out infinite' }}>♡</div>
            <PhoneAvatar phone={match?.phone || '415'} size={72} accent="lavender"/>
          </div>
          <div style={{ marginTop: 28, fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>{match?.phone || '(415) 555-0192'}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button accent={accent} onClick={onClose}>Text {(match?.name || 'them').split(' ')[0]}</Button>
          <Button variant="ghost" onClick={onBack}>Keep it cool</Button>
        </div>
      </div>
    </div>
  );
}

export function ScreenProfile({ accent, onAccent }) {
  const Row = ({ label, value, last, onClick }) => (
    <div onClick={onClick} style={{ padding: '14px 18px', borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 15, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{value}</div>
    </div>
  );
  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ padding: '0 24px 8px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{title}</div>
      <div style={{ margin: '0 16px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>{children}</div>
    </div>
  );
  return (
    <div style={{ position: 'relative', height: '100%', color: '#fff', overflow: 'auto', background: BRAND.ink, paddingBottom: 120 }}>
      <Aura accent={accent} intensity={0.4}/>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '72px 24px 24px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', marginBottom: 12 }}>
            <PhoneAvatar phone="5551234567" size={84} accent={accent}/>
          </div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>(555) 123-4567</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Joined April 2026</div>
        </div>
        <Section title="Accent hue">
          <div style={{ padding: 16, display: 'flex', gap: 10 }}>
            {['pink', 'lavender', 'blue'].map(a => (
              <button key={a} onClick={() => onAccent(a)} style={{
                flex: 1, height: 60, borderRadius: 14, cursor: 'pointer',
                background: gradient(a, '135deg'),
                border: accent === a ? '2px solid #fff' : '2px solid transparent',
                boxShadow: accent === a ? `0 8px 24px ${ACCENT_PRESETS[a].a}60` : 'none',
                color: '#fff', fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
              }}>{a}</button>
            ))}
          </div>
        </Section>
        <Section title="Privacy">
          <Row label="Your number" value="(555) 123-4567"/>
          <Row label="Visible to" value="No one"/>
          <Row label="Block list" value="0 numbers" last/>
        </Section>
        <Section title="About">
          <Row label="How Mutual works" value="→" onClick={() => {}}/>
          <Row label="Privacy policy" value="→" onClick={() => {}}/>
          <Row label="Delete account" value="" last onClick={() => {}}/>
        </Section>
      </div>
    </div>
  );
}
