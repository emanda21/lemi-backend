'use client';

import Link from 'next/link';
import { ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

// ── Corn/Maize only — matches the 4 model classes exactly ──────────────────
const recentScans = [
  {
    id: 'scan-blight',
    image: '/corn-blight.jpg',
    plant:   { am: 'የበቆሎ ቅጠል', or: 'Baala Boqqolloo' },
    disease: { am: 'የቅጠል መድረቅ', or: 'Dhibee Gogsaa' },
    date:    { am: 'ዛሬ',         or: 'Har\'aa' },
    status: 'diseased',
  },
  {
    id: 'scan-rust',
    image: '/corn-rust.jpg',
    plant:   { am: 'የበቆሎ ቅጠል', or: 'Baala Boqqolloo' },
    disease: { am: 'የቅጠል ዝገት',  or: 'Xurrii Baalaa' },
    date:    { am: 'ትናንት',       or: 'Kaleessa' },
    status: 'diseased',
  },
  {
    id: 'scan-gray',
    image: '/corn-gray-spot.jpg',
    plant:   { am: 'የበቆሎ ቅጠል', or: 'Baala Boqqolloo' },
    disease: { am: 'ግራጫ ነጠብጣብ', or: 'Dhibee Garaa' },
    date:    { am: 'ሰኔ 15, 2024', or: 'Wax. 15, 2024' },
    status: 'diseased',
  },
  {
    id: 'scan-healthy',
    image: '/corn-healthy.jpg',
    plant:   { am: 'የበቆሎ ቅጠል', or: 'Baala Boqqolloo' },
    disease: { am: 'ጤናማ',        or: 'Fayyaa' },
    date:    { am: 'ሰኔ 10, 2024', or: 'Wax. 10, 2024' },
    status: 'healthy',
  },
];

// ── SVG fallback when image file is not yet in public/ ───────────────────────
function makeFallback(scan) {
  const diseased = scan.status === 'diseased';
  const bg   = diseased ? '#431407' : '#052e16';
  const fill = diseased ? '#fb923c' : '#4ade80';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${bg}"/>
      <path d="M100 20 C100 20,155 55,155 105 C155 148,130 172,100 178 C70 172,45 148,45 105 C45 55,100 20,100 20Z"
            fill="${fill}" opacity="0.4"/>
      <path d="M100 175 C100 175,98 115,100 28"
            stroke="${fill}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
      <text x="100" y="100" text-anchor="middle" font-family="sans-serif"
            font-size="11" fill="${fill}" opacity="0.9">${scan.diseaseAmharic}</text>
      <text x="100" y="118" text-anchor="middle" font-family="sans-serif"
            font-size="9" fill="${fill}" opacity="0.6">Corn • ${scan.diseaseEn}</text>
    </svg>`)}`;
}

export default function RecentScans() {
  const { language } = useApp();
  const lang = language === 'or' ? 'or' : 'am';
  const header  = lang === 'or' ? 'Qorannoo Dhiyoo'   : 'የቅርብ ምርመራዎች';
  const viewAll = lang === 'or' ? 'Hunda Ilaali'       : 'ሁሉንም ይመልከቱ';
  const healthy = lang === 'or' ? 'Fayyaa'             : 'ጤናማ';
  const sick    = lang === 'or' ? 'Dhukkubsate'        : 'ታምሟል';
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-gray-800 dark:text-gray-100 font-bold text-base"
          style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
        >
          {header}
        </h3>
        <Link
          href="/dashboard/history"
          id="view-all-scans"
          className="flex items-center gap-1 text-green-600 text-xs font-semibold hover:text-green-700 transition-colors"
        >
          <span style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>{viewAll}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Corn class badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🌽</span>
        <p className="text-gray-400 text-[10px] font-medium tracking-wide uppercase">
          Corn / Maize — All 4 Model Classes
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {recentScans.map((scan) => (
          <div
            key={scan.id}
            id={scan.id}
            className="stat-card bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer"
          >
            {/* Image */}
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
              <img
                src={scan.image}
                alt={scan.diseaseEn}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = makeFallback(scan);
                }}
              />
              {/* Status badge */}
              <div
                className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                  scan.status === 'healthy'
                    ? 'bg-green-500/90 text-white'
                    : 'bg-amber-500/90 text-white'
                }`}
              >
                {scan.status === 'healthy'
                  ? <CheckCircle2 className="w-2.5 h-2.5" />
                  : <AlertCircle className="w-2.5 h-2.5" />
                }
                <span style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                  {scan.status === 'healthy' ? healthy : sick}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p
                className="text-gray-800 dark:text-gray-100 font-semibold text-xs leading-tight"
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                {scan.plant[lang]}
              </p>
              <p
                className={`text-xs mt-0.5 font-medium ${
                  scan.status === 'healthy' ? 'text-green-600' : 'text-amber-600'
                }`}
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                {scan.disease[lang]}
              </p>
              <p
                className="text-gray-400 text-[10px] mt-1"
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                {scan.date[lang]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
