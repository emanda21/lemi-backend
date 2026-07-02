'use client';

import { useApp } from '@/context/AppContext';

const diseases = [
  { rank: 1, name: { am: 'ቅጠል ቡናነት', or: 'Baalaan Gubachuu'  }, nameEn: 'Leaf Blight',     count: 5, color: '#ef4444' },
  { rank: 2, name: { am: 'ዱቀት ፈንጋይ', or: 'Holqa Dhukkubaa'   }, nameEn: 'Powdery Mildew',  count: 3, color: '#f97316' },
  { rank: 3, name: { am: 'ዝገት',      or: 'Xurrii'            }, nameEn: 'Rust',           count: 2, color: '#eab308' },
];

const maxCount = 5;

export default function TopDiseases() {
  const { language } = useApp();
  const lang = language === 'or' ? 'or' : 'am';
  const header = lang === 'or' ? 'Dhibeewwan Irra Deddeebii' : 'ተደጋጋሚ በሽታዎች';
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h3
        className="text-gray-800 font-bold text-sm mb-4"
        style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
      >
        {header}
      </h3>
      <div className="space-y-3">
        {diseases.map((d) => (
          <div key={d.rank} className="flex items-center gap-3">
            {/* Rank badge */}
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
              style={{ background: d.color }}
            >
              {d.rank}
            </div>
            {/* Name */}
            <div className="flex-1 min-w-0">
              <p
                className="text-gray-800 text-xs font-semibold truncate"
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                {d.name[lang]}
              </p>
              {/* Progress bar */}
              <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(d.count / maxCount) * 100}%`,
                    background: d.color,
                  }}
                />
              </div>
            </div>
            {/* Count */}
            <span className="text-gray-500 text-xs font-semibold flex-shrink-0">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
