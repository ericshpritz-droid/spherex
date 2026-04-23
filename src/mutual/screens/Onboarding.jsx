import React, { useState, useEffect } from 'react';
import { ACCENT_PRESETS, formatPhone } from '../brand.js';
import { Button } from '../components/Button.jsx';
import { LinkedRings, Aura, NumPad, Wordmark } from '../components/index.jsx';

export function ScreenWelcome({ accent, onNext }) {
  return (
    <div className="relative h-full overflow-hidden bg-ink text-white">
      <Aura accent={accent} intensity={1.1}/>
      <div className="relative z-[1] h-full flex flex-col" style={{ padding: '32px 32px 56px' }}>
        <div className="flex justify-center">
          <Wordmark size={56} accent={accent}/>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-8">
          <div className="flex justify-center">
            <LinkedRings size={132} accent={accent} spin/>
          </div>
          <div>
            <div className="font-extrabold text-center tracking-sora-mega" style={{ fontSize: 52, lineHeight: 0.95 }}>
              Your sphere<br/>starts with<br/>one number.
            </div>
            <div className="mt-5 text-center text-[17px] text-fg-70 tracking-sora-tight" style={{ lineHeight: 1.45 }}>
              Add a number. If they add yours back,<br/>you're in each other's sphere.
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Button accent={accent} onClick={onNext}>Enter your number →</Button>
          <div className="text-center text-[13px] text-fg-45">
            You'll review terms before creating your account.
          </div>
        </div>
      </div>
    </div>
  );
}

function TermsSheet({ accent, open, onClose, onAgree }) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-ink text-white"
        style={{
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: '24px 24px 28px',
          maxHeight: '88%', overflowY: 'auto',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1.5 rounded-full bg-glass-12"/>
        </div>
        <div className="font-bold tracking-sora-display" style={{ fontSize: 26, lineHeight: 1.1 }}>
          Before you continue
        </div>
        <div className="mt-1 text-[13px] text-fg-55">Plain-English summary of how Sphere handles your number.</div>

        <div className="mt-5 flex flex-col gap-3">
          <TermItem accent={accent} icon="🔒" title="Numbers you add are hashed">
            Every contact you upload is one-way hashed on our servers with a secret key before it touches the database. Even our admins can't see who you've added — only an opaque code.
          </TermItem>
          <TermItem accent={accent} icon="🤝" title="Matches stay between the two of you">
            We compare hashes, never raw numbers. The only way someone learns you added them is if they add you back — then you both see each other.
          </TermItem>
          <TermItem accent={accent} icon="📱" title="Your login number">
            Your own phone number is only used to send your login code, never shared, never shown to anyone.
          </TermItem>
          <TermItem accent={accent} icon="🛡️" title="Per-user access rules">
            On top of hashing, your contacts list is protected by row-level security. Other users cannot read your adds or your matches.
          </TermItem>
          <TermItem accent={accent} icon="🗑️" title="Delete anytime">
            Sign out and request deletion from the profile screen and we'll wipe your account and all your hashed adds.
          </TermItem>
          <TermItem accent={accent} icon="📜" title="The legal stuff">
            By continuing you agree to our{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-white">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-white">Privacy Policy</a>.
            You confirm you're 17+ and that you have the right to share any phone numbers you add.
          </TermItem>
        </div>

        <div className="mt-6">
          <Button accent={accent} onClick={onAgree}>I agree — create my account</Button>
        </div>
        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-[14px] text-fg-55 bg-transparent border-0 cursor-pointer"
          style={{ padding: 8 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function TermItem({ accent, icon, title, children }) {
  return (
    <div
      className="rounded-[14px] bg-glass-04 border border-hairline-08 flex gap-3"
      style={{ padding: 14 }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${ACCENT_PRESETS[accent].a}22`, fontSize: 18 }}
      >{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-white">{title}</div>
        <div className="mt-0.5 text-[13px] text-fg-70" style={{ lineHeight: 1.45 }}>{children}</div>
      </div>
    </div>
  );
}

export function ScreenPhone({ accent, onSendCode, onBack, deliveryMode = 'sms', deliveryStatus = '', resendCooldownSeconds = 30 }) {
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const formatted = formatPhone(digits);
  const valid = digits.length === 10;
  const phoneError = showValidation && !valid ? 'Enter a valid 10-digit mobile number.' : '';

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = window.setInterval(() => {
      setResendCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendCountdown]);

  const send = async () => {
    setErr(''); setBusy(true);
    try { await onSendCode(digits); }
    catch (e) {
      const message = e?.message || 'We could not send your code.';
      const nextSteps = /wait \d+s/i.test(message)
        ? 'Wait for the timer to finish, then tap send code again.'
        : /network|connection|fetch/i.test(message)
          ? 'Check your signal or internet connection and try again.'
          : /unreachable|invalid destination|undeliverable|cannot receive|landline|not a mobile|destination/i.test(message)
            ? 'Confirm this number can receive SMS messages, then check the number and try again.'
          : /valid phone number|mobile number/i.test(message)
            ? 'Double-check the number and try again.'
            : 'Please try again in a moment. If it still fails, confirm this number can receive SMS.';
      setErr(`${message} ${nextSteps}`);
    }
    finally {
      setBusy(false);
      setResendCountdown(resendCooldownSeconds);
    }
  };

  const submit = async () => {
    if (busy) return;
    if (!valid) {
      setShowValidation(true);
      setErr('');
      return;
    }
    if (!agreed) { setShowTerms(true); return; }
    await send();
  };

  return (
    <div className="relative h-full overflow-hidden bg-ink text-white">
      <Aura accent={accent} intensity={0.7}/>
      <div className="relative z-[1] h-full flex flex-col" style={{ padding: '72px 28px 32px' }}>
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-full border-0 bg-glass-08 text-white text-xl cursor-pointer mb-6"
        >←</button>
        <div className="font-bold tracking-sora-display" style={{ fontSize: 34, lineHeight: 1.05 }}>What's your<br/>number?</div>
        <div className="mt-3 text-[15px] text-fg-60" style={{ lineHeight: 1.45 }}>
          We'll send a 6-digit code to your phone so you can sign in.
        </div>
        <div className="mt-8">
          <div className="flex items-center gap-3 rounded-[18px] bg-glass-06 border border-hairline-12" style={{ padding: '18px 20px' }}>
            <div className="font-semibold text-[22px] text-fg-50">🇺🇸 +1</div>
            <div className="w-px h-6 bg-hairline-12"/>
            <div className="flex-1 font-semibold text-2xl text-white" style={{ letterSpacing: -0.6 }}>
              {formatted || <span className="text-fg-30">(500) 555-0006</span>}
            </div>
          </div>
          {phoneError && <div className="mt-3 text-[13px] text-error" style={{ lineHeight: 1.4 }}>{phoneError}</div>}
          {err && (
            <div
              className="mt-3 rounded-[14px] bg-glass-06 border border-hairline-12"
              style={{ padding: 12 }}
            >
              <div className="text-[13px] font-semibold text-error">Couldn’t send code</div>
              <div className="mt-1 text-[13px] text-fg-70" style={{ lineHeight: 1.45 }}>{err}</div>
              <button
                onClick={async () => {
                  if (busy || !valid) return;
                  await send();
                }}
                disabled={busy || !valid}
                className="mt-3 bg-transparent border-0 cursor-pointer text-[13px] font-semibold disabled:cursor-not-allowed"
                style={{
                  padding: 0,
                  color: busy || !valid ? 'rgba(255,255,255,0.4)' : ACCENT_PRESETS[accent].a,
                }}
              >
                {busy ? 'Retrying…' : 'Retry'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 text-[13px] text-fg-60" style={{ lineHeight: 1.5 }}>
          Enter the mobile number you want to sign in with.
        </div>

        <div
          className="mt-4 rounded-[14px] bg-glass-06 border border-hairline-12"
          style={{ padding: 12 }}
        >
          <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: deliveryMode === 'preview_fallback' ? '#f59e0b' : ACCENT_PRESETS[accent].a }}
            />
            {deliveryMode === 'preview_fallback' ? 'Preview-code fallback active' : 'Real SMS delivery active'}
          </div>
          <div className="mt-1 text-[12px] text-fg-60" style={{ lineHeight: 1.45 }}>
            {deliveryMode === 'preview_fallback'
              ? 'If SMS delivery is unavailable, the app can fall back to an on-screen code for testing.'
              : 'Codes are currently being sent through Twilio SMS.'}
          </div>
          {deliveryStatus && (
            <div className="mt-2 text-[12px] text-fg-55" style={{ lineHeight: 1.45 }}>
              Last send status: {deliveryStatus}
            </div>
          )}
          <div className="mt-3 flex flex-col gap-1">
            <button
              onClick={async () => {
                if (busy || resendCountdown > 0 || !valid) return;
                if (!valid) {
                  setShowValidation(true);
                  setErr('');
                  return;
                }
                if (!agreed) {
                  setShowTerms(true);
                  return;
                }
                await send();
              }}
              disabled={busy || resendCountdown > 0 || !valid}
              className="self-start bg-transparent border-0 cursor-pointer text-[13px] font-semibold disabled:cursor-not-allowed"
              style={{
                padding: 0,
                color: busy || resendCountdown > 0 || !valid ? 'rgba(255,255,255,0.4)' : ACCENT_PRESETS[accent].a,
              }}
            >
              {busy ? 'Sending…' : resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
            </button>
            <div className="text-[12px] text-fg-55" style={{ lineHeight: 1.45 }}>
              Retry with the same number once the cooldown finishes.
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowTerms(true)}
          className="mt-4 self-start text-left bg-transparent border-0 cursor-pointer"
          style={{ padding: 0 }}
        >
          <div className="text-[13px] text-fg-60" style={{ lineHeight: 1.5 }}>
            By tapping <span className="text-white font-semibold">Send code</span> you agree to our{' '}
            <span style={{ color: ACCENT_PRESETS[accent].a, textDecoration: 'underline' }}>
              Terms &amp; Privacy
            </span>
            . {agreed ? '✓ Agreed' : 'Tap to review.'}
          </div>
        </button>

        <div className="flex-1"/>
        <NumPad onKey={(k) => {
          setErr('');
          if (k === 'del') {
            setDigits(d => d.slice(0, -1));
            return;
          }
          if (digits.length < 10) setDigits(d => d + k);
          if (showValidation) setShowValidation(true);
        }}/>
        <div className="mt-5">
          <Button accent={accent} disabled={!valid || busy} onClick={submit}>
            {busy ? 'Sending…' : agreed ? 'Send code' : 'Review terms & send code'}
          </Button>
        </div>
      </div>

      <TermsSheet
        accent={accent}
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAgree={async () => {
          setAgreed(true);
          setShowTerms(false);
          if (valid) {
            await send();
          }
        }}
      />
    </div>
  );
}

export function ScreenCode({ accent, phoneFormatted, codeHint, deliveryMode = 'sms', deliveryStatus = '', onVerify, onBack, onResend, resendCooldownSeconds = 30 }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(resendCooldownSeconds);

  useEffect(() => {
    setResendCountdown(resendCooldownSeconds);
  }, [phoneFormatted, resendCooldownSeconds]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = window.setInterval(() => {
      setResendCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendCountdown]);

  useEffect(() => {
    if (code.length === 6 && !busy) {
      setErr(''); setBusy(true);
      onVerify(code)
        .catch((e) => {
          const message = e?.message || 'We could not verify that code.';
          const nextSteps = /expired/i.test(message)
            ? 'Request a new code and try again.'
            : /too many attempts/i.test(message)
              ? 'Wait for the resend timer, request a fresh code, then enter the latest one.'
              : /already been used/i.test(message)
                ? 'Request a new code and use the most recent message only.'
                : /invalid code/i.test(message)
                  ? 'Double-check the latest code you received, or tap resend when it becomes available.'
                  : 'Check the latest code you received and try again, or resend a fresh code.';
          setErr(`${message} ${nextSteps}`);
          setCode('');
        })
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
        <div
          className="mt-4 rounded-[14px] border border-hairline-12 bg-glass-06"
          style={{ padding: '12px 14px' }}
        >
          <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: deliveryMode === 'preview_fallback' ? '#f59e0b' : ACCENT_PRESETS[accent].a }}
            />
            {deliveryMode === 'preview_fallback' ? 'Preview-code fallback active' : 'SMS handed off to Twilio'}
          </div>
          <div className="mt-1 text-[12px] text-fg-60" style={{ lineHeight: 1.45 }}>
            {deliveryMode === 'preview_fallback'
              ? 'SMS delivery was not confirmed, so use the on-screen code below for testing.'
              : 'Twilio accepted the request, but handset delivery can still take a moment.'}
          </div>
          {deliveryStatus && (
            <div className="mt-2 text-[12px] text-fg-55" style={{ lineHeight: 1.45 }}>
              {deliveryStatus}
            </div>
          )}
          {codeHint && (
            <div className="mt-2 text-[13px] text-white" style={{ lineHeight: 1.45 }}>
              Fallback code: <span className="font-semibold">{codeHint}</span>
            </div>
          )}
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
        {err && (
          <div
            className="mt-4 rounded-[14px] border border-hairline-12 bg-glass-06 text-left"
            style={{ padding: '12px 14px' }}
          >
            <div className="text-[13px] font-semibold text-error">Verification failed</div>
            <div className="mt-1 text-[13px] text-fg-70" style={{ lineHeight: 1.45 }}>{err}</div>
          </div>
        )}
        {busy && <div className="mt-4 text-center text-sm text-fg-60">Verifying…</div>}
        <div className="mt-5 flex flex-col items-center gap-2">
          <button
            onClick={async () => {
              if (resendBusy || resendCountdown > 0) return;
              setErr('');
              setResendBusy(true);
              try {
                await onResend();
                setCode('');
                setResendCountdown(resendCooldownSeconds);
              } catch (e) {
                setErr(e?.message || 'Could not resend code');
              } finally {
                setResendBusy(false);
              }
            }}
            disabled={resendBusy || resendCountdown > 0}
            className="bg-transparent border-0 cursor-pointer text-[14px] font-semibold disabled:cursor-not-allowed"
            style={{
              padding: 0,
              color: resendBusy || resendCountdown > 0 ? 'rgba(255,255,255,0.4)' : ACCENT_PRESETS[accent].a,
            }}
          >
            {resendBusy ? 'Resending…' : resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
          </button>
          <div className="text-center text-[12px] text-fg-55" style={{ lineHeight: 1.45 }}>
            You can request another code after the countdown finishes.
          </div>
        </div>
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
