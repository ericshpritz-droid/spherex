import React, { useState, useEffect } from 'react';
import { ACCENT_PRESETS, formatPhone } from '../brand.js';
import { Button } from '../components/Button.jsx';
import { LinkedRings, Aura, NumPad } from '../components/index.jsx';

export function ScreenWelcome({ accent, onNext }) {
  return (
    <div className="relative h-full overflow-hidden bg-ink text-white">
      <Aura accent={accent} intensity={1.1}/>
      <div className="relative z-[1] h-full flex flex-col" style={{ padding: '120px 32px 56px' }}>
        <div className="flex-1 flex flex-col justify-center gap-10">
          <div className="flex justify-center">
            <LinkedRings size={140} accent={accent} spin/>
          </div>
          <div>
            <div className="font-extrabold text-center tracking-sora-mega" style={{ fontSize: 56, lineHeight: 0.95 }}>
              Only if<br/>they pick<br/>you back.
            </div>
            <div className="mt-5 text-center text-[17px] text-fg-70 tracking-sora-tight" style={{ lineHeight: 1.45 }}>
              Add a number. If they add yours too,<br/>it's mutual. No DMs. No maybe.
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Button accent={accent} onClick={onNext}>Enter your number →</Button>
          <div className="text-center text-[13px] text-fg-45">
            By continuing you agree to the things.
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScreenPhone({ accent, onSendCode, onBack }) {
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const formatted = formatPhone(digits);
  const valid = digits.length === 10;

  const submit = async () => {
    setErr(''); setBusy(true);
    try { await onSendCode(digits); }
    catch (e) { setErr(e?.message || 'Could not send code'); }
    finally { setBusy(false); }
  };

  return (
    <div className="relative h-full overflow-hidden bg-ink text-white">
      <Aura accent={accent} intensity={0.7}/>
      <div className="relative z-[1] h-full flex flex-col" style={{ padding: '72px 28px 40px' }}>
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-full border-0 bg-glass-08 text-white text-xl cursor-pointer mb-6"
        >←</button>
        <div className="font-bold tracking-sora-display" style={{ fontSize: 34, lineHeight: 1.05 }}>What's your<br/>number?</div>
        <div className="mt-3 text-[15px] text-fg-60" style={{ lineHeight: 1.45 }}>
          We'll send a 6-digit code. Your number is never shown publicly.
        </div>
        <div className="mt-10">
          <div className="flex items-center gap-3 rounded-[18px] bg-glass-06 border border-hairline-12" style={{ padding: '18px 20px' }}>
            <div className="font-semibold text-[22px] text-fg-50">🇺🇸 +1</div>
            <div className="w-px h-6 bg-hairline-12"/>
            <div className="flex-1 font-semibold text-2xl text-white" style={{ letterSpacing: -0.6 }}>
              {formatted || <span className="text-fg-30">(555) 123-4567</span>}
            </div>
          </div>
          {err && <div className="mt-3 text-[13px] text-error" style={{ lineHeight: 1.4 }}>{err}</div>}
        </div>
        <div className="flex-1"/>
        <NumPad onKey={(k) => {
          if (k === 'del') setDigits(d => d.slice(0, -1));
          else if (digits.length < 10) setDigits(d => d + k);
        }}/>
        <div className="mt-5">
          <Button accent={accent} disabled={!valid || busy} onClick={submit}>{busy ? 'Sending…' : 'Send code'}</Button>
        </div>
      </div>
    </div>
  );
}

export function ScreenCode({ accent, phoneFormatted, onVerify, onBack }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (code.length === 6 && !busy) {
      setErr(''); setBusy(true);
      onVerify(code)
        .catch((e) => { setErr(e?.message || 'Invalid code'); setCode(''); })
        .finally(() => setBusy(false));
    }
  }, [code, busy, onVerify]);

  return (
    <div className="relative h-full overflow-hidden bg-ink text-white">
      <Aura accent={accent} intensity={0.7}/>
      <div className="relative z-[1] h-full flex flex-col" style={{ padding: '72px 28px 40px' }}>
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-full border-0 bg-glass-08 text-white text-xl cursor-pointer mb-6"
        >←</button>
        <div className="font-bold tracking-sora-display" style={{ fontSize: 34, lineHeight: 1.05 }}>Check your<br/>texts.</div>
        <div className="mt-3 text-[15px] text-fg-60" style={{ lineHeight: 1.45 }}>
          Six digits coming to <span className="text-white">{phoneFormatted}</span>.
        </div>
        <div className="mt-10 flex gap-2.5 justify-between">
          {[0,1,2,3,4,5].map(i => {
            const d = code[i]; const active = i === code.length;
            return (
              <div
                key={i}
                className="flex-1 rounded-[14px] bg-glass-06 flex items-center justify-center font-bold text-white"
                style={{
                  aspectRatio: '1 / 1.15',
                  border: `1.5px solid ${active ? ACCENT_PRESETS[accent].a : 'rgba(255,255,255,0.12)'}`,
                  boxShadow: active ? `0 0 0 4px ${ACCENT_PRESETS[accent].a}22` : undefined,
                  fontSize: 28,
                }}
              >{d}</div>
            );
          })}
        </div>
        {err && <div className="mt-4 text-center text-[13px] text-error">{err}</div>}
        {busy && <div className="mt-4 text-center text-sm text-fg-60">Verifying…</div>}
        <div className="flex-1"/>
        <NumPad onKey={(k) => {
          if (busy) return;
          if (k === 'del') setCode(c => c.slice(0, -1));
          else if (code.length < 6) setCode(c => c + k);
        }}/>
      </div>
    </div>
  );
}
