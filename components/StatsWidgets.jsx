'use client';

import { Wifi, WifiOff, Globe, Leaf } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const stats = [
  {
    id: 'stat-offline',
    icon: WifiOff,
    iconBg: '#16a34a',
    title:    { am: '100% ያለ ኢንተርኔት',         or: '100% Toora Malee' },
    subtitle: { am: 'ያለ ኢንተርኔት ይሰራል',         or: 'Toora malee hojjeta' },
    detail:   { am: 'ሁሉም ውሂብ በእርስዎ መሳሪያ ላይ',  or: 'Deetaan meeshaa keenya irratti' },
  },
  {
    id: 'stat-language',
    icon: Globe,
    iconBg: '#2563eb',
    title:    { am: 'ባለብዙ ቋንቋ',             or: 'Afaan Hedduu' },
    subtitle: { am: 'በሚፈልጉት ቋንቋ ይመርምሩ',     or: 'Afaan barbaaddaniin qoradha' },
    detail:   { am: '10+ ቋንቋዎች',            or: 'Afaan 10+' },
  },
  {
    id: 'stat-treatment',
    icon: Leaf,
    iconBg: '#65a30d',
    title:    { am: 'የደረጃ ህክምና',           or: 'Yaalii Sadarkaa' },
    subtitle: { am: 'ከባዮ-ህክምና እስከ ኬሚካል',   or: 'Bio-yaalii hanga keemikaalaatti' },
    detail:   { am: 'ዘለቄታዊ ፈውስ',          or: 'Fayyina waaraa' },
  },
];

export default function StatsWidgets() {
  const { language } = useApp();
  const lang = language === 'or' ? 'or' : 'am';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            id={stat.id}
            className="stat-card bg-white rounded-2xl p-5 border border-gray-100 shadow-sm cursor-default"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow"
                style={{ background: stat.iconBg }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-gray-900 dark:text-white font-bold text-sm leading-tight"
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                >
                  {stat.title[lang]}
                </p>
                <p
                  className="text-gray-500 dark:text-gray-300 text-xs mt-0.5 leading-snug"
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                >
                  {stat.subtitle[lang]}
                </p>
                <p
                  className="text-gray-400 dark:text-gray-400 text-[11px] mt-1"
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                >
                  {stat.detail[lang]}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
