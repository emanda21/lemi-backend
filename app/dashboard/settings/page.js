'use client';

import { useState } from 'react';
import { Settings, Bell, Moon, Wifi, Smartphone, Info, Shield, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const T = {
  am: {
    appearance:   'ገጽታ',
    connectivity: 'ግንኙነት',
    notifications:'ማሳወቂያ',
    about:        'ስለ መተግበሪያው',
    rows: {
      darkMode:    { label: 'ጨለማ ሁነታ',       sub: 'Dark Mode' },
      sound:       { label: 'የድምፅ ምላሽ',       sub: 'Sound feedback on scan' },
      vibration:   { label: 'ንዝረት',            sub: 'Vibration on result' },
      offline:     { label: 'ያለ ኢንተርኔት ሁነታ', sub: 'Use AI model on-device' },
      dataSaving:  { label: 'ዳታ ቆጣቢ',         sub: 'Reduce image quality for uploads' },
      autoScan:    { label: 'ራስ-ሰር ምርምር',      sub: 'Auto-analyse on photo selection' },
      notifs:      { label: 'ማሳወቂያዎች',         sub: 'Push notifications' },
      analytics:   { label: 'ስታቲስቲክስ',         sub: 'Share anonymous usage data' },
      version:     { label: 'ስሪት',              sub: 'LEMI AI v1.0.0 — MVP' },
      privacy:     { label: 'ግላዊነት',            sub: 'Privacy Policy' },
      licenses:    { label: 'ፈቃዶች',             sub: 'Open Source Licenses' },
    },
  },
  or: {
    appearance:   'Mul\'ata',
    connectivity: 'Walquunnamtii',
    notifications:'Beeksisa',
    about:        'Waa\'ee App',
    rows: {
      darkMode:    { label: 'Haala Dukkanaa',    sub: 'Dark Mode' },
      sound:       { label: 'Deebii Sagalee',    sub: 'Sound feedback on scan' },
      vibration:   { label: 'Raafama',           sub: 'Vibration on result' },
      offline:     { label: 'Toora Malee',       sub: 'Modela AI meeshaa irratti fayyadami' },
      dataSaving:  { label: 'Deetaa Qusachuu',   sub: 'Hamma suuraa hir\'isuu' },
      autoScan:    { label: 'Qorannoo Ofumaa',   sub: 'Suuraa filatamee booda qori' },
      notifs:      { label: 'Beeksisa',          sub: 'Push notifications' },
      analytics:   { label: 'Statistiksi',       sub: 'Ragaa maqaa-maletti hirmaadhu' },
      version:     { label: 'Vershinii',         sub: 'LEMI AI v1.0.0 — MVP' },
      privacy:     { label: 'Iccitii',           sub: 'Privacy Policy' },
      licenses:    { label: 'Hayyama',           sub: 'Open Source Licenses' },
    },
  },
};

function Toggle({ id, checked, onChange }) {
  return (
    <button id={id} role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative rounded-full transition-colors duration-200 flex-shrink-0 ${checked ? 'bg-green-500' : 'bg-gray-200'}`}
      style={{ height: '22px', width: '40px' }}>
      <span className={`absolute top-0.5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
            style={{ width: '18px', height: '18px', top: '2px' }} />
    </button>
  );
}

function SettingRow({ id, icon: Icon, label, sublabel, checked, onChange, isLink }) {
  return (
    <div className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/40 transition-colors">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-gray-800 text-sm font-semibold" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>{label}</p>
            {sublabel && <p className="text-gray-400 text-xs mt-0.5">{sublabel}</p>}
          </div>
        </div>
        {isLink ? <ChevronRight className="w-4 h-4 text-gray-300" />
                : <Toggle id={id} checked={checked} onChange={onChange} />}
      </div>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{title}</p>
    </div>
  );
}

export default function SettingsPage() {
  const { language } = useApp();
  const t = language === 'or' ? T.or : T.am;
  const r = t.rows;

  const [s, setS] = useState({
    notifications: true, darkMode: false, autoScan: false,
    offlineMode: true,   dataSaving: true, analytics: false,
    soundFeedback: true, vibration: true,
  });
  const set = (key) => (val) => setS((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Appearance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title={t.appearance} />
        <SettingRow id="dark-mode-toggle"  icon={Moon}       label={r.darkMode.label}  sublabel={r.darkMode.sub}  checked={s.darkMode}      onChange={set('darkMode')} />
        <SettingRow id="sound-toggle"      icon={Bell}       label={r.sound.label}     sublabel={r.sound.sub}     checked={s.soundFeedback}  onChange={set('soundFeedback')} />
        <SettingRow id="vibration-toggle"  icon={Smartphone} label={r.vibration.label} sublabel={r.vibration.sub} checked={s.vibration}      onChange={set('vibration')} />
      </div>

      {/* Connectivity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title={t.connectivity} />
        <SettingRow id="offline-toggle"    icon={Wifi}     label={r.offline.label}    sublabel={r.offline.sub}    checked={s.offlineMode}  onChange={set('offlineMode')} />
        <SettingRow id="data-toggle"       icon={Wifi}     label={r.dataSaving.label} sublabel={r.dataSaving.sub} checked={s.dataSaving}   onChange={set('dataSaving')} />
        <SettingRow id="auto-scan-toggle"  icon={Settings} label={r.autoScan.label}   sublabel={r.autoScan.sub}   checked={s.autoScan}     onChange={set('autoScan')} />
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title={t.notifications} />
        <SettingRow id="notifications-toggle" icon={Bell} label={r.notifs.label}    sublabel={r.notifs.sub}    checked={s.notifications} onChange={set('notifications')} />
        <SettingRow id="analytics-toggle"     icon={Info} label={r.analytics.label} sublabel={r.analytics.sub} checked={s.analytics}     onChange={set('analytics')} />
      </div>

      {/* About */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title={t.about} />
        <SettingRow id="info-version" icon={Info}   label={r.version.label}  sublabel={r.version.sub}  isLink checked={false} onChange={() => {}} />
        <SettingRow id="info-privacy" icon={Shield} label={r.privacy.label}  sublabel={r.privacy.sub}  isLink checked={false} onChange={() => {}} />
        <SettingRow id="info-license" icon={Info}   label={r.licenses.label} sublabel={r.licenses.sub} isLink checked={false} onChange={() => {}} />
      </div>

      <p className="text-center text-gray-400 text-xs pb-2">LEMI AI • Edge Plant Disease Detection • v1.0.0</p>
    </div>
  );
}
