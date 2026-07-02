'use client';

import { useState } from 'react';
import { WifiOff, Cpu, HardDrive, CheckCircle2, RefreshCw, Database, Zap } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const MODEL_INFO = {
  name: 'LEMI Lite-0 Web Model', version: 'v1.0.0',
  size: '~23 MB', classes: 4, input: '224 × 224 px', format: 'Keras (.h5)',
};

const T = {
  am: {
    modeActive:   'OFFLINE MODE ACTIVE',
    heroTitle:    'ያለ ኢንተርኔት ሁነታ',
    heroSub:      'AI ሞዴሉ መሣሪያዎ ላይ ሙሉ በሙሉ ሰርቷል',
    stat1:        'ሞዴል ሁኔታ',   stat1v: 'ዝግጁ',
    stat2:        'ዓይነቶች',      stat2v: '4 Classes',
    stat3:        'Inference',   stat3v: '< 100ms',
    modelInfo:    'AI Model Information',
    storageTitle: 'ማስቀመጫ ሁኔታ',
    sync:         'Sync',
    syncing:      'Syncing…',
    privacyTitle: '🔒 100% ግላዊ — Edge AI',
    privacyDesc:  'ምርመራዎ ምስሎችዎ ወደ ውጭ አይሄዱም። ሁሉም ሂደት መሣሪያዎ ላይ ይካሄዳል። ኢንተርኔት ሳይኖር ሙሉ ተግባር ይሰጣል።',
  },
  or: {
    modeActive:   'TOORA MALEE HOJJECHAA JIRA',
    heroTitle:    'Haaluma Toora Alaa',
    heroSub:      'Modelli AI meeshaa irratti guutummaatti hojjeta',
    stat1:        'Haala Modela',  stat1v: 'Qophaa\'e',
    stat2:        'Gosootaa',      stat2v: 'Gosa 4',
    stat3:        'Inference',     stat3v: '< 100ms',
    modelInfo:    'Odeeffannoo Modela AI',
    storageTitle: 'Haala Kuusaa',
    sync:         'Walsimsiisi',
    syncing:      'Walsimsiisaa…',
    privacyTitle: '🔒 100% Dhuunfaa — Edge AI',
    privacyDesc:  'Suuraaleen qorannoo keessan alaa hin ergaman. Hojiin hundi meeshaa kee irratti raawwatama. Interneetii malee tajaajila guutuu kenna.',
  },
};

export default function OfflinePage() {
  const { language } = useApp();
  const t = language === 'or' ? T.or : T.am;
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => { setSyncing(true); setTimeout(() => setSyncing(false), 2500); };

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #0f2419, #1a3a2a)' }}>
        <div className="p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-bold tracking-wide">{t.modeActive}</span>
            </div>
            <p className="text-white font-bold text-xl leading-tight" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {t.heroTitle}
            </p>
            <p className="text-white/60 text-sm mt-1" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {t.heroSub}
            </p>
          </div>
          <WifiOff className="w-10 h-10 text-green-400/60" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
          {[
            { label: t.stat1, value: t.stat1v, icon: CheckCircle2, color: 'text-green-400' },
            { label: t.stat2, value: t.stat2v, icon: Database,     color: 'text-blue-400'  },
            { label: t.stat3, value: t.stat3v, icon: Zap,          color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="px-4 py-3 text-center">
              <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-white/40 text-[10px]" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Model info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/80">
          <Cpu className="w-4 h-4 text-gray-500" />
          <p className="text-gray-700 font-bold text-sm">{t.modelInfo}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-100">
          {Object.entries(MODEL_INFO).map(([key, val]) => (
            <div key={key} className="bg-white px-4 py-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{key}</p>
              <p className="text-gray-800 font-semibold text-sm mt-0.5">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Storage */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-gray-500" />
            <p className="text-gray-700 font-bold text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {t.storageTitle}
            </p>
          </div>
          <button id="sync-btn" onClick={handleSync} disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-colors disabled:opacity-60">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? t.syncing : t.sync}
          </button>
        </div>
        {[
          { label: 'AI Model',      size: '23 MB',  color: 'bg-green-400', pct: 23 },
          { label: 'Scan History',  size: '< 1 MB', color: 'bg-blue-400',  pct: 1  },
          { label: 'Cache',         size: '5 MB',   color: 'bg-amber-400', pct: 5  },
        ].map(({ label, size, color, pct }) => (
          <div key={label} className="mb-3 last:mb-0">
            <div className="flex justify-between mb-1">
              <p className="text-xs text-gray-600">{label}</p>
              <p className="text-xs font-medium text-gray-500">{size}</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Privacy note */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
        <p className="text-green-800 font-bold text-sm mb-1" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          {t.privacyTitle}
        </p>
        <p className="text-green-700 text-xs leading-relaxed" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          {t.privacyDesc}
        </p>
      </div>
    </div>
  );
}
