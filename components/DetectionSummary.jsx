'use client';

import { useApp } from '@/context/AppContext';

const T = {
  am: { header: 'የምርመራ ማጠቃለያ', healthy: 'ጤናማ', diseased: 'ታምሟል', uncertain: 'ጥርጣሬ', total: 'Total Scans' },
  or: { header: 'Waliigala Qorannoo',  healthy: 'Fayyaa',  diseased: 'Dhukkubsate', uncertain: 'Shakkii', total: 'Waliigala' },
};

export default function DetectionSummary() {
  const { language } = useApp();
  const t = language === 'or' ? T.or : T.am;

  const total = 24, healthy = 14, diseased = 8, uncertain = 2;
  const r = 42;
  const circumference  = 2 * Math.PI * r;
  const healthyDash    = (healthy   / total) * circumference;
  const diseasedDash   = (diseased  / total) * circumference;
  const uncertainDash  = (uncertain / total) * circumference;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h3 className="text-gray-800 font-bold text-sm mb-4" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
        {t.header}
      </h3>

      <div className="flex items-center gap-4">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
            <circle cx="50" cy="50" r={r} fill="none" stroke="#22c55e" strokeWidth="12"
              strokeDasharray={`${healthyDash} ${circumference}`} strokeDashoffset="0"
              className="donut-ring" strokeLinecap="butt" />
            <circle cx="50" cy="50" r={r} fill="none" stroke="#ef4444" strokeWidth="12"
              strokeDasharray={`${diseasedDash} ${circumference}`} strokeDashoffset={`-${healthyDash}`}
              className="donut-ring" />
            <circle cx="50" cy="50" r={r} fill="none" stroke="#d1d5db" strokeWidth="12"
              strokeDasharray={`${uncertainDash} ${circumference}`} strokeDashoffset={`-${healthyDash + diseasedDash}`}
              className="donut-ring" />
            <text x="50" y="46" textAnchor="middle" style={{ fontSize: '18px', fontWeight: 700, fill: '#1f2937' }}>
              {total}
            </text>
            <text x="50" y="60" textAnchor="middle" style={{ fontSize: '8px', fill: '#9ca3af' }}>
              {t.total}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-2 flex-1">
          <LegendItem color="#22c55e" label={t.healthy}   count={healthy}   />
          <LegendItem color="#ef4444" label={t.diseased}  count={diseased}  />
          <LegendItem color="#d1d5db" label={t.uncertain} count={uncertain} />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, count }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-gray-600 text-xs" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          {label}
        </span>
      </div>
      <span className="text-gray-800 font-bold text-xs">{count}</span>
    </div>
  );
}
