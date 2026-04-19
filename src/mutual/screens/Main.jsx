import React, { useState, useEffect, useRef } from 'react';
import { ACCENT_PRESETS, formatPhone, gradient } from '../brand.js';
import { Button } from '../components/Button.jsx';
import { PhoneAvatar } from '../components/PhoneAvatar.jsx';
import { LinkedRings, Aura, NumPad, Wordmark } from '../components/index.jsx';
import { Spinner } from '../components/Spinner.jsx';
import { CONTACTS } from '../data.js';

// Compact relative time for last-message timestamps on match cards.
function messageAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 45_000) return 'just now';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(diff / 3_600_000);
  if (h < 24) return `${h}h`;
  const d = Math.floor(diff / 86_400_000);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

// ── Home header
function HomeHeader({ accent, matchCount, onOpenProfile }) {
  const p = ACCENT_PRESETS[accent] || ACCENT_PRESETS.pink;
  return (
    <div style={{ padding: '64px 24px 8px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wordmark size={26} accent={accent} />
        </div>
        <button
          onClick={onOpenProfile}
          aria-label="Profile"
          className="w-11 h-11 rounded-full border-0 cursor-pointer flex items-center justify-center text-white font-bold"
          style={{
            background: `linear-gradient(135deg, ${p.a} 0%, ${p.b} 100%)`,
            boxShadow: `0 6px 18px ${p.a}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
            fontSize: 15,
          }}
        >
          ME
        </button>
      </div>
      <div className="mt-6">
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

function PendingRow({ person, accent, invited = false }) {
  const [showWhy, setShowWhy] = useState(false);
  const isHidden = !!person.unknown && !invited;
  return (
    <div className="relative rounded-[18px] bg-glass-04 border border-hairline-06 flex items-center gap-3.5" style={{ padding: '14px 16px' }}>
      <PhoneAvatar phone={person.phone} size={44} accent={person.avatar}/>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-white tracking-sora-tight flex items-center gap-2">
          <span className="truncate">{person.unknown ? person.phone : person.name}</span>
          {isHidden && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowWhy((v) => !v); }}
              className="shrink-0 inline-flex items-center justify-center rounded-full text-[10px] font-semibold text-fg-55 hover:text-white cursor-pointer"
              style={{
                width: 18, height: 18,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
              aria-label="Why is this contact hidden?"
            >
              ?
            </button>
          )}
          {invited && (
            <span
              className="shrink-0 rounded-full text-[9px] font-semibold uppercase tracking-widest text-white/85"
              style={{
                padding: '2px 7px',
                background: `linear-gradient(135deg, ${ACCENT_PRESETS[accent].a}, ${ACCENT_PRESETS[accent].b})`,
                letterSpacing: 1.2,
              }}
              title="You opened their invite link"
            >
              Invited you
            </span>
          )}
        </div>
        <div className="text-[13px] text-fg-50 flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: ACCENT_PRESETS[accent].b, animation: 'mutualPulse 1.8s ease-in-out infinite' }}
          />
          {invited ? 'You were invited by them · add them back' : 'Waiting'}
        </div>
      </div>
      <div className="text-lg text-fg-30">⋯</div>

      {showWhy && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowWhy(false)} />
          <div
            role="tooltip"
            className="absolute left-4 right-4 z-50 rounded-[12px] text-[12px] leading-snug text-white/90"
            style={{
              top: 'calc(100% + 6px)',
              padding: '10px 12px',
              background: 'rgba(20, 14, 32, 0.96)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 12px 30px -12px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <div className="font-semibold text-white mb-0.5">Why hidden?</div>
            For privacy, you only see numbers of people you've added. They'll appear once you both add each other.
          </div>
        </>
      )}
    </div>
  );
}

function vibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch { /* ignore */ }
}

function usePullToRefresh(onRefresh, { threshold = 70, max = 110 } = {}) {
  const ref = useRef(null);
  const startY = useRef(null);
  const pulling = useRef(false);
  const armed = useRef(false); // true once threshold crossed in current gesture
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof onRefresh !== 'function') return;

    const onStart = (e) => {
      if (refreshing) return;
      if (el.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
      armed.current = false;
    };
    const onMove = (e) => {
      if (!pulling.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { setPull(0); return; }
      // Resistance curve
      const eased = Math.min(max, dy * 0.5);
      setPull(eased);
      // Haptic tick the first time we cross the threshold in this gesture,
      // and a softer tick if user backs off below it again.
      if (!armed.current && eased >= threshold) {
        armed.current = true;
        vibrate(12);
      } else if (armed.current && eased < threshold - 6) {
        armed.current = false;
        vibrate(6);
      }
      if (dy > 6 && el.scrollTop <= 0) e.preventDefault();
    };
    const onEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      const reached = pull >= threshold;
      startY.current = null;
      if (reached) {
        setRefreshing(true);
        setPull(threshold);
        try { await onRefresh(); } catch { /* handled upstream */ }
        setRefreshing(false);
        // Confirmation pulse on refresh complete
        vibrate([8, 40, 8]);
      }
      armed.current = false;
      setPull(0);
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [onRefresh, pull, refreshing, threshold, max]);

  return { ref, pull, refreshing };
}

function PullIndicator({ pull, refreshing, accent, threshold = 70 }) {
  const visible = pull > 0 || refreshing;
  if (!visible) return null;
  const progress = Math.min(1, pull / threshold);
  return (
    <div
      style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: refreshing ? 56 : Math.max(0, pull),
        pointerEvents: 'none', zIndex: 5,
        transition: refreshing ? 'height 180ms ease' : 'none',
      }}
    >
      {refreshing ? (
        <Spinner accent={accent} size={24}/>
      ) : (
        <div
          style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.15)',
            borderTopColor: ACCENT_PRESETS[accent]?.a || '#F13F5E',
            transform: `rotate(${progress * 360}deg)`,
            opacity: 0.4 + progress * 0.6,
          }}
        />
      )}
    </div>
  );
}

function RefreshingPill({ accent }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 6, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', borderRadius: 999,
        background: 'rgba(20,20,28,0.7)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'mutualFadeIn 180ms ease-out',
      }}
    >
      <Spinner accent={accent} size={12}/>
      <span className="text-[12px] text-fg-75 font-medium">Refreshing…</span>
    </div>
  );
}

export function ScreenHome({ accent, matches, pending, onOpenMatch, onAdd, onInvite, onOpenProfile, loading = false, refreshing: bgRefreshing = false, error = null, onRetry, variant = 'cards', lastByHash = {}, unreadByHash = {}, myHash = '', invitedByHash = '', photoByHash = null }) {
  const { ref: pullRef, pull, refreshing } = usePullToRefresh(onRetry);
  // Only show the background pill when not already pulling-to-refresh
  const showPill = bgRefreshing && !refreshing && pull === 0;
  if (loading) {
    return (
      <div className="h-full bg-ink text-white relative overflow-hidden">
        <Aura accent={accent} intensity={0.5}/>
        <div className="relative z-[1] h-full flex flex-col items-center justify-center gap-4">
          <Spinner accent={accent} size={44}/>
          <div className="text-sm text-fg-60">Loading your mutuals…</div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-full bg-ink text-white relative overflow-auto pb-[120px]">
        <Aura accent={accent} intensity={0.5}/>
        <div className="relative z-[1]">
          <HomeHeader accent={accent} matchCount={0} onOpenProfile={onOpenProfile}/>
          <div className="rounded-[28px] bg-glass-04 text-center" style={{ margin: '40px 24px', padding: 28, border: '1px solid rgba(241,63,94,0.25)' }}>
            <div className="text-[28px] mb-2">⚠️</div>
            <div className="font-bold text-[18px]">Couldn't load your mutuals</div>
            <div className="mt-2 text-sm text-fg-60" style={{ lineHeight: 1.4 }}>{error}</div>
            {onRetry && (
              <div className="mt-5"><Button accent={accent} onClick={onRetry} full={false}>Try again</Button></div>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (matches.length === 0 && pending.length === 0) {
    return (
      <div ref={pullRef} className="h-full bg-ink text-white relative overflow-auto pb-[120px]" style={{ overscrollBehaviorY: 'contain' }}>
        <Aura accent={accent} intensity={0.5}/>
        <PullIndicator pull={pull} refreshing={refreshing} accent={accent}/>
        {showPill && <RefreshingPill accent={accent}/>}
        <div className="relative z-[1]" style={{ transform: `translateY(${refreshing ? 56 : pull}px)`, transition: pull === 0 && !refreshing ? 'transform 180ms ease' : 'none' }}>
          <HomeHeader accent={accent} matchCount={0} onOpenProfile={onOpenProfile}/>
          <div className="rounded-[28px] bg-glass-04 text-center" style={{ margin: '40px 24px', padding: 32, border: '1px dashed rgba(255,255,255,0.12)' }}>
            <div className="flex justify-center mb-5">
              <LinkedRings size={96} accent={accent}/>
            </div>
            <div className="font-bold text-[22px]">Nothing mutual yet</div>
            <div className="mt-2 text-sm text-fg-60" style={{ lineHeight: 1.4 }}>
              Sphere lights up when someone you've added<br/>adds you back. Invite a few friends to start.
            </div>
            <div className="mt-5 flex flex-col gap-2 items-stretch">
              {onInvite && (
                <div
                  onClick={onInvite}
                  className="rounded-[16px] text-white font-semibold cursor-pointer"
                  style={{
                    padding: '14px 16px', fontSize: 15,
                    background: gradient(accent, '135deg'),
                    boxShadow: `0 10px 28px ${ACCENT_PRESETS[accent].a}40`,
                  }}
                >
                  ✨ Invite friends
                </div>
              )}
              <button
                onClick={onAdd}
                className="rounded-[14px] bg-glass-08 border border-hairline-10 text-white text-[14px] font-semibold cursor-pointer"
                style={{ padding: '12px 14px' }}
              >
                + Add a number
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const accentRotation = ['pink', 'lavender', 'blue'];
  return (
    <div ref={pullRef} className="h-full bg-ink text-white overflow-auto relative pb-[120px]" style={{ overscrollBehaviorY: 'contain' }}>
      <Aura accent={accent} intensity={0.5}/>
      <PullIndicator pull={pull} refreshing={refreshing} accent={accent}/>
      {showPill && <RefreshingPill accent={accent}/>}
      <div className="relative z-[1]" style={{ transform: `translateY(${refreshing ? 56 : pull}px)`, transition: pull === 0 && !refreshing ? 'transform 180ms ease' : 'none' }}>
        <HomeHeader accent={accent} matchCount={matches.length} onOpenProfile={onOpenProfile}/>
        <div style={{ padding: '20px 20px 0' }}>
          <div className="text-[13px] font-medium text-fg-55 tracking-sora-label uppercase mb-3" style={{ paddingLeft: 4 }}>Matched</div>
          <div className="flex flex-col gap-4">
            {matches.map((m, i) => {
              const last = lastByHash[m.id];
              const unread = !!unreadByHash[m.id];
              const fromMe = last && myHash && last.sender_phone_hash === myHash;
              const cardAccent = accentRotation[i % accentRotation.length];
              const cp = ACCENT_PRESETS[cardAccent];
              return (
                <div
                  key={i}
                  onClick={() => onOpenMatch(m)}
                  className="rounded-[28px] text-white cursor-pointer relative overflow-hidden"
                  style={{
                    padding: 22,
                    background: gradient(cardAccent, '145deg'),
                    boxShadow: `0 18px 40px ${cp.a}40, inset 0 1px 0 rgba(255,255,255,0.18)`,
                    minHeight: 168,
                  }}
                >
                  {/* Decorative orbs */}
                  <div className="absolute rounded-full pointer-events-none" style={{ top: -60, right: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.16)', filter: 'blur(2px)' }}/>
                  <div className="absolute rounded-full pointer-events-none" style={{ bottom: -50, left: -30, width: 140, height: 140, background: 'rgba(255,255,255,0.08)' }}/>

                  {/* Top row: avatar + name/phone, timestamp pill */}
                  <div className="relative flex items-start gap-4">
                    <PhoneAvatar phone={m.phone} size={64} accent={m.avatar} photoUrl={photoByHash ? (photoByHash.get?.(String(m.id)) || photoByHash[String(m.id)]) : null}/>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="font-bold tracking-sora-tighter truncate" style={{ fontSize: 22, lineHeight: 1.15 }}>{m.name}</div>
                      <div className="text-[13px] text-white/75 mt-0.5 truncate">{m.phone}</div>
                    </div>
                    <div
                      className="font-semibold rounded-full shrink-0"
                      style={{ fontSize: 11, padding: '5px 10px', background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                    >{m.matchedAt}</div>
                  </div>

                  {/* Bottom row: last message preview or "Say hi" */}
                  <div className="relative mt-4 flex items-center gap-2">
                    {last ? (
                      <>
                        <div
                          className="rounded-full flex items-center min-w-0 flex-1"
                          style={{
                            padding: '6px 12px', fontSize: 13, lineHeight: 1.2,
                            background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                          }}
                          title={fromMe ? 'You sent' : 'They sent'}
                        >
                          <span style={{ fontSize: 11, opacity: 0.85, marginRight: 6, fontWeight: 700 }}>
                            {fromMe ? 'You' : '→'}
                          </span>
                          <span className="truncate">{last.body}</span>
                        </div>
                        <div className="text-[11px] text-white/75 shrink-0" style={{ letterSpacing: 0.1 }}>
                          {messageAgo(last.created_at)}
                        </div>
                        {unread && (
                          <span
                            aria-label="New message"
                            className="rounded-full shrink-0"
                            style={{
                              width: 10, height: 10, background: '#ffffff',
                              boxShadow: '0 0 0 2px rgba(0,0,0,0.18)',
                              animation: 'mutualPulse 1.8s ease-in-out infinite',
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <div
                        className="rounded-full inline-flex items-center"
                        style={{
                          padding: '6px 12px', fontSize: 12, fontWeight: 600,
                          background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        }}
                      >
                        ✨ Say hi
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {pending.length > 0 && (
          <div style={{ padding: '28px 20px 0' }}>
            <div className="flex items-center justify-between mb-3" style={{ paddingLeft: 4 }}>
              <div className="text-[13px] font-medium text-fg-55 tracking-sora-label uppercase">Pending · {pending.length}</div>
              <div className="text-[12px] text-fg-55">Not mutual yet</div>
            </div>
            <div className="flex flex-col gap-2">
              {pending.map((p, i) => <PendingRow key={i} person={p} accent={accent} invited={!!invitedByHash && String(p.id) === invitedByHash}/>)}
            </div>
          </div>
        )}
      </div>

      {/* Floating action button: add a number */}
      <button
        onClick={onAdd}
        aria-label="Add a number"
        className="absolute z-20 rounded-full border-0 cursor-pointer text-white flex items-center justify-center font-bold"
        style={{
          right: 20, bottom: 28,
          width: 60, height: 60,
          fontSize: 30, lineHeight: 1,
          background: gradient(accent, '135deg'),
          boxShadow: `0 14px 32px ${ACCENT_PRESETS[accent].a}66, inset 0 1px 0 rgba(255,255,255,0.3)`,
        }}
      >+</button>
    </div>
  );
}

export function ScreenAdd({ accent, onSubmit, onBack, onBrowseContacts, allowTestPin = false }) {
  const [digits, setDigits] = useState('');
  const isTestPin = allowTestPin && digits.length === 4;
  const valid = digits.length === 10 || isTestPin;
  return (
    <div className="relative h-full overflow-hidden bg-ink text-white">
      <Aura accent={accent} intensity={0.5}/>
      <div className="relative z-[1] h-full flex flex-col" style={{ padding: '72px 24px 40px' }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full border-0 bg-glass-08 text-white text-lg cursor-pointer">←</button>
          <div className="font-bold text-[22px]">Add a number</div>
        </div>
        <div className="rounded-[18px] bg-glass-04 border border-hairline-10 mb-4" style={{ padding: 18 }}>
          <div className="text-xs font-semibold text-fg-50 uppercase mb-2.5" style={{ letterSpacing: 0.4 }}>
            {isTestPin ? 'Their test PIN' : 'Their phone'}
          </div>
          <div className="flex items-center gap-3">
            <div className="font-semibold text-xl text-fg-50">{isTestPin ? '🧪' : '🇺🇸 +1'}</div>
            <div className="w-px bg-hairline-12" style={{ height: 22 }}/>
            <div className="flex-1 font-semibold text-white tracking-sora-tighter" style={{ fontSize: 22 }}>
              {isTestPin
                ? digits
                : (formatPhone(digits) || <span className="text-fg-25">(555) 000-0000</span>)}
            </div>
          </div>
        </div>
        {allowTestPin && (
          <div className="text-[12px] text-fg-50 -mt-2 mb-3">
            Tip: in test mode, enter their 4-digit PIN instead of a full number.
          </div>
        )}
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
            {valid
              ? (isTestPin ? 'Add by PIN' : 'Add them')
              : (allowTestPin ? 'Enter 4-digit PIN or 10-digit number' : 'Enter 10 digits')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Extract candidate phone numbers from arbitrary pasted text or a vCard blob.
// Strategy: scan for digit runs of 7-15 (allowing spaces/dashes/parens/dots/+
// between them), then keep US-shaped 10-digit (or 11-digit starting with 1)
// candidates. Returns formatted "(###) ###-####" strings, deduped.
function extractPhones(text) {
  if (!text) return [];
  const out = [];
  const seen = new Set();
  // Match runs that look phone-like.
  const re = /(\+?\d[\d\s().\-]{6,20}\d)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    let d = m[1].replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
    if (d.length !== 10) continue;
    if (!/^[2-9]/.test(d)) continue;
    if (seen.has(d)) continue;
    seen.add(d);
    out.push(`(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`);
  }
  return out;
}

// Pair phones with the closest preceding FN: line in a .vcf so we can show
// names in the confirmation sheet.
function parseVCardEntries(text) {
  if (!text) return [];
  // Unfold continuation lines (RFC 6350: a line starting with space/tab
  // continues the previous one).
  const unfolded = String(text).replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);
  const out = [];
  const seen = new Set();
  let currentName = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    // FN may be FN: or FN;CHARSET=...:
    const fnMatch = line.match(/^FN(?:;[^:]*)?:(.*)$/i);
    if (fnMatch) { currentName = fnMatch[1].trim(); continue; }
    if (/^BEGIN:VCARD/i.test(line)) { currentName = ''; continue; }
    const telMatch = line.match(/^TEL(?:;[^:]*)?:(.*)$/i);
    if (telMatch) {
      let d = telMatch[1].replace(/\D/g, '');
      if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
      if (d.length !== 10 || !/^[2-9]/.test(d)) continue;
      if (seen.has(d)) continue;
      seen.add(d);
      out.push({
        name: currentName || '',
        phone: `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`,
      });
    }
  }
  return out;
}

export function ScreenContacts({ accent, onBack, onPick }) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState(new Set());
  const [pickerSupported, setPickerSupported] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  // Confirmation sheet for device-picked contacts
  const [confirmList, setConfirmList] = useState(null); // null | Array<{ name, phone }>
  const fileInputRef = useRef(null);
  useEffect(() => {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    setPickerSupported(!!(nav && nav.contacts && typeof nav.contacts.select === 'function'));
  }, []);

  const filtered = CONTACTS.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
  const toggle = (phone) => {
    const s = new Set(picked); s.has(phone) ? s.delete(phone) : s.add(phone); setPicked(s);
  };
  const groups = {};
  filtered.forEach(c => { const k = c.name[0].toUpperCase(); (groups[k] = groups[k] || []).push(c); });
  const letters = Object.keys(groups).sort();

  const openDevicePicker = async () => {
    if (!pickerSupported || pickerBusy) return;
    setPickerBusy(true);
    try {
      const results = await navigator.contacts.select(['name', 'tel'], { multiple: true });
      const items = [];
      const seen = new Set();
      for (const r of results) {
        const tels = Array.isArray(r.tel) ? r.tel : [];
        const names = Array.isArray(r.name) ? r.name : [];
        const displayName = (names.find(Boolean) || '').toString().trim();
        for (const t of tels) {
          if (!t) continue;
          const phone = String(t);
          if (seen.has(phone)) continue;
          seen.add(phone);
          items.push({ name: displayName, phone });
        }
      }
      if (items.length > 0) setConfirmList(items);
    } catch (e) {
      // user cancelled or denied — silent
    } finally {
      setPickerBusy(false);
    }
  };

  const removeConfirmItem = (phone) => {
    setConfirmList((list) => {
      if (!list) return list;
      const next = list.filter((i) => i.phone !== phone);
      return next.length === 0 ? null : next;
    });
  };

  const confirmAdd = () => {
    if (!confirmList || confirmList.length === 0) return;
    const phones = confirmList.map((i) => i.phone);
    setConfirmList(null);
    onPick(phones);
  };

  // Manual entry: store only digits. Strip a leading "1" (US country code) and cap at 10.
  const normalizeManual = (raw) => {
    let d = String(raw).replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
    return d.slice(0, 10);
  };
  const manualDigits = manualPhone; // already normalized in onChange
  const manualValid = manualDigits.length === 10;
  const manualError =
    manualDigits.length === 0
      ? ''
      : manualDigits.length < 10
        ? `${10 - manualDigits.length} more digit${10 - manualDigits.length === 1 ? '' : 's'}`
        : !/^[2-9]/.test(manualDigits)
          ? 'US numbers can\u2019t start with 0 or 1'
          : '';
  const submitManual = () => {
    if (!manualValid || manualError) return;
    onPick([manualDigits]);
    setManualPhone('');
    setManualName('');
  };

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

        <div className="flex flex-wrap gap-2 mb-3">
          {pickerSupported && (
            <button
              onClick={openDevicePicker}
              disabled={pickerBusy}
              className="flex-1 rounded-[14px] border border-hairline-10 bg-glass-08 text-white text-[14px] font-semibold cursor-pointer"
              style={{ padding: '12px 14px', opacity: pickerBusy ? 0.6 : 1, minWidth: '46%' }}
            >
              {pickerBusy ? 'Opening…' : '📇 Pick from device'}
            </button>
          )}
          {!pickerSupported && (
            <>
              <button
                onClick={() => setShowPaste(v => !v)}
                className="flex-1 rounded-[14px] border border-hairline-10 bg-glass-08 text-white text-[14px] font-semibold cursor-pointer"
                style={{ padding: '12px 14px', minWidth: '46%' }}
              >
                {showPaste ? 'Hide paste' : 'Paste a list'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 rounded-[14px] border border-hairline-10 bg-glass-08 text-white text-[14px] font-semibold cursor-pointer"
                style={{ padding: '12px 14px', minWidth: '46%' }}
              >
                Upload .vcf
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".vcf,text/vcard,text/x-vcard"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const items = parseVCardEntries(text);
                    if (items.length === 0) {
                      // Fallback: scan raw text for phone-shaped runs.
                      const phones = extractPhones(text);
                      if (phones.length === 0) return;
                      setConfirmList(phones.map((p) => ({ name: '', phone: p })));
                      return;
                    }
                    setConfirmList(items);
                  } catch {
                    /* ignore unreadable files */
                  }
                }}
              />
            </>
          )}
          <button
            onClick={() => setShowManual(v => !v)}
            className="flex-1 rounded-[14px] border border-hairline-10 bg-glass-06 text-white text-[14px] font-semibold cursor-pointer"
            style={{ padding: '12px 14px', minWidth: '46%' }}
          >
            {showManual ? 'Hide manual' : 'Enter manually'}
          </button>
        </div>

        {showPaste && !pickerSupported && (
          <div className="rounded-[14px] bg-glass-06 border border-hairline-08 mb-3" style={{ padding: 12 }}>
            <div className="text-[12px] text-fg-55 mb-2" style={{ lineHeight: 1.4 }}>
              Paste names + numbers from anywhere. We'll grab the US phone numbers.
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value.slice(0, 20000))}
              placeholder={'Alex Kim 555-123-4567\nSam Lee (415) 555 9876'}
              rows={5}
              className="w-full bg-transparent border-0 outline-none text-white text-[14px] resize-y"
              style={{ padding: '6px 4px', lineHeight: 1.4, fontFamily: 'inherit' }}
            />
            {(() => {
              const found = extractPhones(pasteText);
              return (
                <>
                  <div className="mt-2 text-[12px] text-fg-55 px-1">
                    {found.length === 0 ? 'No phone numbers found yet.' : `Found ${found.length} number${found.length === 1 ? '' : 's'}.`}
                  </div>
                  <div className="mt-3">
                    <Button
                      accent={accent}
                      disabled={found.length === 0}
                      onClick={() => {
                        setConfirmList(found.map((p) => ({ name: '', phone: p })));
                        setPasteText('');
                        setShowPaste(false);
                      }}
                    >
                      {found.length === 0 ? 'Paste at least one number' : `Review ${found.length}`}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {showManual && (
          <div className="rounded-[14px] bg-glass-06 border border-hairline-08 mb-3" style={{ padding: 12 }}>
            <input
              value={manualName}
              onChange={e => setManualName(e.target.value.slice(0, 80))}
              placeholder="Name (optional)"
              maxLength={80}
              className="w-full bg-transparent border-0 outline-none text-white text-[15px] mb-2"
              style={{ padding: '6px 4px' }}
            />
            <div
              className="flex items-center gap-2.5"
              style={{ padding: '6px 4px', borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="text-[15px] font-semibold text-fg-60 select-none">🇺🇸 +1</span>
              <span className="w-px h-5 bg-hairline-12"/>
              <input
                value={formatPhone(manualDigits)}
                onChange={e => setManualPhone(normalizeManual(e.target.value))}
                placeholder="(555) 123-4567"
                inputMode="tel"
                autoComplete="tel-national"
                className="flex-1 bg-transparent border-0 outline-none text-white text-[15px]"
              />
            </div>
            {manualError && (
              <div className="mt-2 text-[12px] text-fg-50 px-1">{manualError}</div>
            )}
            <div className="mt-3">
              <Button accent={accent} disabled={!manualValid || !!manualError} onClick={submitManual}>
                {manualValid && !manualError ? 'Add them' : 'Enter a 10-digit US number'}
              </Button>
            </div>
          </div>
        )}

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
        {letters.length === 0 ? (
          <div
            className="rounded-[20px] bg-glass-04 text-center"
            style={{ margin: '24px 16px 0', padding: 28, border: '1px dashed rgba(255,255,255,0.12)' }}
          >
            <div className="flex justify-center mb-4">
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 72, height: 72,
                  background: `${ACCENT_PRESETS[accent].a}18`,
                  border: `1px solid ${ACCENT_PRESETS[accent].a}40`,
                  fontSize: 30,
                }}
              >🔍</div>
            </div>
            <div className="font-bold text-[18px]">No contacts match “{q}”</div>
            <div className="mt-2 text-[13px] text-fg-60" style={{ lineHeight: 1.45 }}>
              Try a different name or number — or add them by hand.
            </div>
            <div className="mt-5 flex flex-col gap-2 items-center">
              <Button
                accent={accent}
                full={false}
                onClick={() => {
                  setShowManual(true);
                  // Pre-fill manual entry if the query looks like digits
                  const justDigits = q.replace(/\D/g, '');
                  if (justDigits.length > 0 && justDigits.length <= 11) {
                    setManualPhone(normalizeManual(justDigits));
                  }
                }}
              >
                ✍️ Enter “{q}” manually
              </Button>
              <button
                onClick={() => setQ('')}
                className="bg-transparent border-0 text-[13px] text-fg-55 cursor-pointer"
                style={{ padding: 6 }}
              >
                Clear search
              </button>
            </div>
          </div>
        ) : letters.map(L => (
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

      {confirmList && (
        <>
          <div
            className="absolute inset-0 z-40"
            onClick={() => setConfirmList(null)}
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 z-50 bg-ink text-white"
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              padding: '14px 16px 20px',
              maxHeight: '75%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="mx-auto mb-3 rounded-full"
              style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.18)' }}
            />
            <div className="flex items-baseline justify-between mb-1 px-1">
              <div className="font-bold text-[18px]">
                Add {confirmList.length} {confirmList.length === 1 ? 'person' : 'people'}?
              </div>
              <button
                onClick={() => setConfirmList(null)}
                className="text-fg-50 text-sm bg-transparent border-0 cursor-pointer"
              >Cancel</button>
            </div>
            <div className="text-[13px] text-fg-55 mb-3 px-1">
              They won't be notified unless they add you back.
            </div>
            <div className="flex-1 overflow-y-auto" style={{ marginBottom: 12 }}>
              {confirmList.map((c) => (
                <div
                  key={c.phone}
                  className="flex items-center gap-3 rounded-[14px]"
                  style={{
                    padding: '10px 12px',
                    marginBottom: 4,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <PhoneAvatar phone={c.phone} size={36} accent={accent}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold truncate">
                      {c.name || c.phone}
                    </div>
                    {c.name && (
                      <div className="text-[13px] text-fg-50 truncate">{c.phone}</div>
                    )}
                  </div>
                  <button
                    onClick={() => removeConfirmItem(c.phone)}
                    aria-label="Remove"
                    className="w-7 h-7 rounded-full border-0 bg-glass-08 text-white cursor-pointer flex items-center justify-center text-sm"
                  >✕</button>
                </div>
              ))}
            </div>
            <Button accent={accent} onClick={confirmAdd}>
              Add {confirmList.length} {confirmList.length === 1 ? 'person' : 'people'}
            </Button>
          </div>
        </>
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
