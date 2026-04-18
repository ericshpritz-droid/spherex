import React, { useState, useEffect } from 'react';
import { BRAND, ACCENT_PRESETS, formatPhone, gradient } from '../brand.js';
import { Button } from '../components/Button.jsx';
import { LinkedRings, Aura, NumPad } from '../components/index.jsx';

export function ScreenWelcome({ accent, onNext }) {
  return (
    <div style={{ position: 'relative', height: '100%', color: '#fff', overflow: 'hidden', background: BRAND.ink }}>
      <Aura accent={accent} intensity={1.1}/>
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', padding: '120px 32px 56px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <LinkedRings size={140} accent={accent} spin/>
          </div>
          <div>
            <div style={{ fontFamily: 'Sora, system-ui', fontWeight: 800, fontSize: 56, lineHeight: 0.95, letterSpacing: -2.5, textAlign: 'center' }}>
              Only if<br/>they pick<br/>you back.
            </div>
            <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'Sora, system-ui', fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45, letterSpacing: -0.2 }}>
              Add a number. If they add yours too,<br/>it's mutual. No DMs. No maybe.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button accent={accent} onClick={onNext}>Enter your number →</Button>
          <div style={{ textAlign: 'center', fontFamily: 'Sora, system-ui', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            By continuing you agree to the things.
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScreenPhone({ accent, onNext, onBack }) {
  const [digits, setDigits] = useState('5551234567');
  const formatted = formatPhone(digits);
  const valid = digits.length === 10;
  return (
    <div style={{ position: 'relative', height: '100%', color: '#fff', overflow: 'hidden', background: BRAND.ink }}>
      <Aura accent={accent} intensity={0.7}/>
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', padding: '72px 28px 40px' }}>
        <button onClick={onBack} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 20, cursor: 'pointer', marginBottom: 24 }}>←</button>
        <div style={{ fontFamily: 'Sora, system-ui', fontWeight: 700, fontSize: 34, lineHeight: 1.05, letterSpacing: -1.2 }}>What's your<br/>number?</div>
        <div style={{ marginTop: 12, fontFamily: 'Sora, system-ui', fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>
          We'll send a 6-digit code. Your number is never shown publicly.
        </div>
        <div style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontFamily: 'Sora, system-ui', fontWeight: 600, fontSize: 22, color: 'rgba(255,255,255,0.5)' }}>🇺🇸 +1</div>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.12)' }}/>
            <div style={{ flex: 1, fontFamily: 'Sora, system-ui', fontWeight: 600, fontSize: 24, color: '#fff', letterSpacing: -0.6 }}>
              {formatted || <span style={{ color: 'rgba(255,255,255,0.3)' }}>(555) 123-4567</span>}
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <NumPad onKey={(k) => {
          if (k === 'del') setDigits(d => d.slice(0, -1));
          else if (digits.length < 10) setDigits(d => d + k);
        }}/>
        <div style={{ marginTop: 20 }}>
          <Button accent={accent} disabled={!valid} onClick={onNext}>Send code</Button>
        </div>
      </div>
    </div>
  );
}

export function ScreenCode({ accent, onNext, onBack }) {
  const [code, setCode] = useState('');
  useEffect(() => {
    if (code.length === 6) { const t = setTimeout(onNext, 500); return () => clearTimeout(t); }
  }, [code]);
  return (
    <div style={{ position: 'relative', height: '100%', color: '#fff', overflow: 'hidden', background: BRAND.ink }}>
      <Aura accent={accent} intensity={0.7}/>
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', padding: '72px 28px 40px' }}>
        <button onClick={onBack} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 20, cursor: 'pointer', marginBottom: 24 }}>←</button>
        <div style={{ fontFamily: 'Sora, system-ui', fontWeight: 700, fontSize: 34, lineHeight: 1.05, letterSpacing: -1.2 }}>Check your<br/>texts.</div>
        <div style={{ marginTop: 12, fontFamily: 'Sora, system-ui', fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>
          Six digits coming to <span style={{ color: '#fff' }}>(555) 123-4567</span>.
        </div>
        <div style={{ marginTop: 40, display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          {[0,1,2,3,4,5].map(i => {
            const d = code[i]; const active = i === code.length;
            return (
              <div key={i} style={{
                flex: 1, aspectRatio: '1 / 1.15', borderRadius: 14,
                background: 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${active ? ACCENT_PRESETS[accent].a : 'rgba(255,255,255,0.12)'}`,
                boxShadow: active ? `0 0 0 4px ${ACCENT_PRESETS[accent].a}22` : undefined,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Sora, system-ui', fontWeight: 700, fontSize: 28, color: '#fff',
              }}>{d}</div>
            );
          })}
        </div>
        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'Sora, system-ui', fontSize: 14, color: ACCENT_PRESETS[accent].b, cursor: 'pointer' }}>Resend in 0:47</div>
        <div style={{ flex: 1 }}/>
        <NumPad onKey={(k) => {
          if (k === 'del') setCode(c => c.slice(0, -1));
          else if (code.length < 6) setCode(c => c + k);
        }}/>
      </div>
    </div>
  );
}
