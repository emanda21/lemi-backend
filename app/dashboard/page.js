'use client';

import HeroBanner from '@/components/HeroBanner';
import StatsWidgets from '@/components/StatsWidgets';
import DetectionSummary from '@/components/DetectionSummary';
import TopDiseases from '@/components/TopDiseases';
import RecentScans from '@/components/RecentScans';
import Link from 'next/link';
import { ScanLine, Mic, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const T = {
  am: {
    scanTitle:    'ቅጠል ምርምር',
    scanSub:      'ፎቶ ወይም ድምፅ ተጠቀም',
    voiceTitle:   'የድምፅ ምርምር',
    voiceSub:     'በአማርኛ ይናገሩ',
    voiceLabel:   'የድምፅ ምርመራ ጽሑፍ',
    historyTitle: 'የምርመራ ታሪክ',
    historyCount: (n) => `${n} ምርመራዎች →`,
  },
  or: {
    scanTitle:    'Baala Qoradhu',
    scanSub:      'Suuraa ykn sagalee fayyadami',
    voiceTitle:   'Qorannoo Sagalee',
    voiceSub:     'Afaan Oromootti dubbadhu',
    voiceLabel:   'Barreeffama Sagalee',
    historyTitle: 'Seenaa Qorannoo',
    historyCount: (n) => `${n} Qorannoo →`,
  },
};

export default function DashboardPage() {
  const { scanHistory, voiceTranscription, language } = useApp();
  const t = language === 'or' ? T.or : T.am;

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* ── Left / main column ──────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Hero */}
        <HeroBanner />

        {/* Quick-action cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Photo scan shortcut */}
          <Link
            href="/dashboard/scan"
            id="quick-photo-scan"
            className="stat-card bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #16a34a, #65a30d)' }}
            >
              <ScanLine className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <div>
              <p className="text-gray-800 font-bold text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                {t.scanTitle}
              </p>
              <p className="text-gray-500 text-xs mt-0.5" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                {t.scanSub}
              </p>
            </div>
          </Link>

          {/* Voice scan shortcut */}
          <Link
            href="/dashboard/scan"
            id="quick-voice-scan"
            className="stat-card bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
            >
              <Mic className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <div>
              <p className="text-gray-800 font-bold text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                {t.voiceTitle}
              </p>
              <p className="text-gray-500 text-xs mt-0.5" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                {t.voiceSub}
              </p>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <StatsWidgets />

        {/* Recent scans */}
        <RecentScans />
      </div>

      {/* ── Right column ────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
        <DetectionSummary />
        <TopDiseases />

        {/* Last voice result */}
        {voiceTranscription && (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-3.5 h-3.5 text-purple-500" />
              <p className="text-[10px] font-semibold text-purple-600" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                {t.voiceLabel}
              </p>
            </div>
            <p className="text-gray-700 text-xs leading-relaxed" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {voiceTranscription}
            </p>
          </div>
        )}

        {/* History summary link */}
        {scanHistory.length > 0 && (
          <Link
            href="/dashboard/history"
            id="history-summary-link"
            className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <p className="text-xs font-bold text-gray-800" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                {t.historyTitle}
              </p>
            </div>
            <p className="text-green-600 text-xs font-semibold" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {t.historyCount(scanHistory.length)}
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
