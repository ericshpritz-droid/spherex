import React, { useState } from 'react';
import { formatPhone } from './brand.js';
import { CONTACTS, ADDED } from './data.js';
import { TabBar } from './components/index.jsx';
import { ScreenWelcome, ScreenPhone, ScreenCode } from './screens/Onboarding.jsx';
import {
  ScreenHome, ScreenAdd, ScreenContacts, ScreenSent,
  ScreenMatchReveal, ScreenProfile,
} from './screens/Main.jsx';

export default function App() {
  const [accent, setAccent] = useState('pink');
  const [scene, setScene] = useState('welcome');
  const [tab, setTab] = useState('home');
  const [added, setAdded] = useState(ADDED);
  const [activeMatch, setActiveMatch] = useState(null);
  const [lastAddedPhone, setLastAddedPhone] = useState('');

  const matches = added.filter(p => p.status === 'matched');
  const pending = added.filter(p => p.status === 'pending');

  const goTab = (t) => {
    setTab(t);
    if (t === 'home') setScene('home');
    if (t === 'add') setScene('add');
    if (t === 'me') setScene('profile');
  };

  const openMatch = (m) => { setActiveMatch(m); setScene('match'); };

  let content;
  if (scene === 'welcome') content = <ScreenWelcome accent={accent} onNext={() => setScene('phone')}/>;
  else if (scene === 'phone') content = <ScreenPhone accent={accent} onNext={() => setScene('code')} onBack={() => setScene('welcome')}/>;
  else if (scene === 'code') content = <ScreenCode accent={accent} onNext={() => { setScene('home'); setTab('home'); }} onBack={() => setScene('phone')}/>;
  else if (scene === 'home') content = <ScreenHome accent={accent} matches={matches} pending={pending} onOpenMatch={openMatch} onAdd={() => goTab('add')}/>;
  else if (scene === 'add') content = (
    <ScreenAdd accent={accent}
      onBack={() => { setScene('home'); setTab('home'); }}
      onBrowseContacts={() => setScene('contacts')}
      onSubmit={(digits) => {
        const phone = formatPhone(digits);
        setAdded([...added, { name: phone, phone, status: 'pending', avatar: 'blue', unknown: true }]);
        setLastAddedPhone(phone); setScene('sent');
      }}/>
  );
  else if (scene === 'contacts') content = (
    <ScreenContacts accent={accent}
      onBack={() => setScene('add')}
      onPick={(phones) => {
        const adds = phones.map(p => {
          const c = CONTACTS.find(x => x.phone === p);
          return { name: c.name, phone: c.phone, status: 'pending', avatar: c.avatar };
        });
        setAdded([...added, ...adds]);
        setLastAddedPhone(phones[0]); setScene('sent');
      }}/>
  );
  else if (scene === 'sent') content = <ScreenSent accent={accent} phone={lastAddedPhone} onDone={() => { setScene('home'); setTab('home'); }}/>;
  else if (scene === 'match') content = <ScreenMatchReveal accent={accent} match={activeMatch || matches[0]} onBack={() => setScene('home')} onClose={() => setScene('home')}/>;
  else if (scene === 'profile') content = <ScreenProfile accent={accent} onAccent={setAccent}/>;

  const showTabBar = ['home', 'add', 'profile'].includes(scene);

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
