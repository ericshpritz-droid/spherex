import React, { useState, useEffect, useCallback } from 'react';
import { CONTACTS } from './data.js';
import { TabBar } from './components/index.jsx';
import { ScreenWelcome, ScreenPhone, ScreenCode } from './screens/Onboarding.jsx';
import {
  ScreenHome, ScreenAdd, ScreenContacts, ScreenSent,
  ScreenMatchReveal, ScreenProfile,
} from './screens/Main.jsx';
import { useSession, sendOtp, verifyOtp, signOut, toE164, formatE164 } from './auth';
import { addPhones, loadAddsAndMatches } from './dataApi';

export default function App() {
  const [accent, setAccent] = useState(
    () => (typeof window !== 'undefined' && localStorage.getItem('mutual.accent')) || 'pink'
  );
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('mutual.accent', accent);
  }, [accent]);

  const { session, loading: sessionLoading, user } = useSession();
  const myPhone = user?.phone ? `+${String(user.phone).replace(/\D/g, '')}` : '';
  const myPhoneFormatted = myPhone ? formatE164(myPhone) : '';

  const [scene, setScene] = useState('welcome');
  const [tab, setTab] = useState('home');
  const [pendingPhone, setPendingPhone] = useState(''); // E.164 used for OTP
  const [matches, setMatches] = useState([]);
  const [pending, setPending] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [lastAddedPhone, setLastAddedPhone] = useState('');

  // Sync scene with auth state
  useEffect(() => {
    if (sessionLoading) return;
    if (session && (scene === 'welcome' || scene === 'phone' || scene === 'code')) {
      setScene('home'); setTab('home');
    } else if (!session && !['welcome', 'phone', 'code'].includes(scene)) {
      setScene('welcome');
    }
  }, [session, sessionLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load data when authenticated
  const refresh = useCallback(async () => {
    if (!myPhone) return;
    try {
      const { matches, pending } = await loadAddsAndMatches(myPhone);
      setMatches(matches); setPending(pending);
    } catch (e) {
      console.error('loadAddsAndMatches failed', e);
    }
  }, [myPhone]);

  useEffect(() => { if (session) refresh(); }, [session, refresh]);

  const goTab = (t) => {
    setTab(t);
    if (t === 'home') { setScene('home'); refresh(); }
    if (t === 'add') setScene('add');
    if (t === 'me') setScene('profile');
  };

  const openMatch = (m) => { setActiveMatch(m); setScene('match'); };

  const handleSendCode = async (digits) => {
    const e164 = toE164(digits);
    setPendingPhone(e164);
    await sendOtp(e164);
    setScene('code');
  };

  const handleVerify = async (code) => {
    await verifyOtp(pendingPhone, code);
    // useSession listener will flip scene to 'home'
  };

  const handleAddDigits = async (digits) => {
    const e164 = toE164(digits);
    try {
      await addPhones(myPhone, [e164]);
      setLastAddedPhone(formatE164(e164));
      setScene('sent');
      refresh();
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Could not add number');
    }
  };

  const handlePickContacts = async (phones) => {
    // phones come as formatted "(415) 555-0192" — convert
    const e164s = phones.map((p) => toE164(p));
    try {
      await addPhones(myPhone, e164s);
      setLastAddedPhone(formatE164(e164s[0]));
      setScene('sent');
      refresh();
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Could not add contacts');
    }
  };

  let content;
  if (sessionLoading) {
    content = <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#120A32', fontFamily: 'Sora, system-ui' }}>Loading…</div>;
  } else if (scene === 'welcome') content = <ScreenWelcome accent={accent} onNext={() => setScene('phone')}/>;
  else if (scene === 'phone') content = <ScreenPhone accent={accent} onSendCode={handleSendCode} onBack={() => setScene('welcome')}/>;
  else if (scene === 'code') content = <ScreenCode accent={accent} phoneFormatted={formatE164(pendingPhone)} onVerify={handleVerify} onBack={() => setScene('phone')}/>;
  else if (scene === 'home') content = <ScreenHome accent={accent} matches={matches} pending={pending} onOpenMatch={openMatch} onAdd={() => goTab('add')}/>;
  else if (scene === 'add') content = (
    <ScreenAdd accent={accent}
      onBack={() => { setScene('home'); setTab('home'); }}
      onBrowseContacts={() => setScene('contacts')}
      onSubmit={handleAddDigits}/>
  );
  else if (scene === 'contacts') content = (
    <ScreenContacts accent={accent}
      onBack={() => setScene('add')}
      onPick={handlePickContacts}/>
  );
  else if (scene === 'sent') content = <ScreenSent accent={accent} phone={lastAddedPhone} onDone={() => { setScene('home'); setTab('home'); refresh(); }}/>;
  else if (scene === 'match') content = <ScreenMatchReveal accent={accent} match={activeMatch || matches[0]} onBack={() => setScene('home')} onClose={() => setScene('home')}/>;
  else if (scene === 'profile') content = (
    <ScreenProfile accent={accent} onAccent={setAccent}
      phone={myPhoneFormatted}
      onSignOut={async () => { await signOut(); setScene('welcome'); setTab('home'); }}/>
  );

  const showTabBar = session && ['home', 'add', 'profile'].includes(scene);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0620', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0' }}>
      <div style={{
        width: 'min(402px, 100vw)', height: 'min(874px, 100vh)',
        maxWidth: 402, maxHeight: 874,
        borderRadius: 48, overflow: 'hidden', position: 'relative',
        background: '#000', boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
      }}>
        {content}
        {showTabBar && <TabBar tab={tab} setTab={goTab} accent={accent}/>}
      </div>
    </div>
  );
}
