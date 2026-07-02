'use client';

import { useApp } from '@/context/AppContext';
import { Trash2, CheckCircle2, AlertCircle, ScanLine, Download } from 'lucide-react';
import Link from 'next/link';

const T = {
  am: {
    empty:       'ምንም ምርመራ አልተደረገም',
    count:       (n) => `${n} ምርመራ${n > 1 ? 'ዎች' : ''} ተመዝግቧል`,
    export:      'Export',
    clearBtn:    'ሁሉንም ሰርዝ',
    clearPrompt: 'ሁሉንም ታሪክ ይሰርዙ?',
    emptyTitle:  'ምርመራ ታሪክ የለም',
    emptySub:    'የመጀመሪያ ምርምርዎን ለማድረግ ወደ ቅጠል ምርምር ይሂዱ',
    emptyBtn:    'ቅጠል ምርምር →',
    cols:        ['ምስል', 'ዕፅዋት', 'በሽታ', 'ዕርግጠኝነት', 'ሁኔታ', 'ቀን', ''],
    colSpans:    { 'ምስል': 'col-span-1', 'ዕፅዋት': 'col-span-2', 'በሽታ': 'col-span-3', 'ዕርግጠኝነት': 'col-span-2', 'ሁኔታ': 'col-span-1', 'ቀን': 'col-span-2', '': 'col-span-1' },
  },
  or: {
    empty:       'Qorannoo hin jiru',
    count:       (n) => `Qorannoo ${n} galmaa\'ame`,
    export:      'Ergii',
    clearBtn:    'Hunda Balleessi',
    clearPrompt: 'Seenaa hunda balleessuu barbaaddaa?',
    emptyTitle:  'Seenaa Qorannoo Hin Jiru',
    emptySub:    'Qorannoo jalqabaaf gara Baala Qoradhu deemi',
    emptyBtn:    'Baala Qoradhu →',
    cols:        ['Suuraa', 'Biqiltuu', 'Dhibee', 'Amantaa', 'Haala', 'Guyyaa', ''],
    colSpans:    { 'Suuraa': 'col-span-1', 'Biqiltuu': 'col-span-2', 'Dhibee': 'col-span-3', 'Amantaa': 'col-span-2', 'Haala': 'col-span-1', 'Guyyaa': 'col-span-2', '': 'col-span-1' },
  },
};

const STATUS_STYLE = {
  healthy:  { icon: CheckCircle2, color: 'text-green-500' },
  diseased: { icon: AlertCircle,  color: 'text-amber-500' },
  unknown:  { icon: AlertCircle,  color: 'text-gray-400'  },
};

// ─── Oromo localization lookup for row data ───────────────────────────────────
// Maps known Amharic API strings → their Afaan Oromoo equivalents.
// Also used as a fallback when scan.nameOr is absent (e.g., legacy history items).
const OR_DISEASE_MAP = {
  // Health status
  'ጤናማ':               'Fayyaa',
  'Healthy':            'Fayyaa',
  'Healthy Corn':       'Boqqolloon Fayyaa',
  // Blight
  'Blight':             'Baalaan Gogsuu',
  'Common Blight':      'Baalaan Gogsuu',
  'Northern Blight':    'Baalaan Gogsuu Kaabaa',
  'Turcicum Blight':    'Baalaan Gogsuu Turcicum',
  'Northern Leaf Blight': 'Dhibee Baala Kaabaa',
  // Rust
  'Common Rust':        'Xurrii Baalaa',
  'Common_Rust':        'Xurrii Baalaa',
  'Rust':               'Xurrii Baalaa',
  'Leaf Rust':          'Xurrii Baalaa',
  // Gray Leaf Spot
  'Gray Leaf Spot':     'Dhibee Garaa Baalaa',
  'Gray_Leaf_Spot':     'Dhibee Garaa Baalaa',
  'Gray Spot':          'Dhibee Garaa',
  // Amharic disease names returned by the API
  'የቅጠል ዝገት':          'Xurrii Baalaa',
  'ቅጠሉ ደርቋል':          'Baalaan Gogsuu',
  'ግራጫ ነጠብጣብ':        'Dhibee Garaa Baalaa',
  'የቅጠል መድረቅ':         'Baalaan Gogsuu',
};

// Plant name map (Amharic → Oromo)
const OR_PLANT_MAP = {
  'በቆሎ (Corn)': 'Boqqolloo (Corn)',
  'Corn':         'Boqqolloo (Corn)',
  'Maize':        'Boqqolloo',
};

/**
 * localiseDisease(scan, lang)
 * Returns the correctly localised disease display name.
 * Priority chain (Oromo): scan.nameOr → OR_DISEASE_MAP[amharic] → OR_DISEASE_MAP[diseaseName] → diseaseName
 * Priority chain (Amharic): scan.amharic → scan.diseaseName
 */
function localiseDisease(scan, lang) {
  if (lang === 'or') {
    if (scan.nameOr)  return scan.nameOr;
    const byAmharic  = OR_DISEASE_MAP[scan.amharic];
    if (byAmharic)   return byAmharic;
    const byEn       = OR_DISEASE_MAP[scan.diseaseName];
    if (byEn)        return byEn;
    return scan.diseaseName ?? 'Hin beekamu';
  }
  return scan.amharic || scan.diseaseName;
}

/**
 * localisePlant(scan, lang)
 * Returns the correctly localised plant name.
 */
function localisePlant(scan, lang) {
  if (lang === 'or') {
    if (scan.plantNameOr) return scan.plantNameOr;
    const mapped = OR_PLANT_MAP[scan.plantName];
    if (mapped)           return mapped;
    return scan.plantName ?? 'Biqiltuu';
  }
  return scan.plantName ?? '—';
}

function formatDate(iso, lang) {
  try {
    return new Intl.DateTimeFormat(lang === 'or' ? 'om-ET' : 'am-ET', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    try {
      return new Intl.DateTimeFormat('en-ET', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso?.slice(0, 10) ?? '—';
    }
  }
}

export default function HistoryPage() {
  const { scanHistory, clearHistory, setCurrentScan, language } = useApp();
  const t    = language === 'or' ? T.or : T.am;
  const lang = language === 'or' ? 'or' : 'am';
  const isEmpty = scanHistory.length === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          {isEmpty ? t.empty : t.count(scanHistory.length)}
        </p>
        {!isEmpty && (
          <div className="flex items-center gap-2">
            <button
              id="export-history-btn"
              onClick={() => {
                const data = JSON.stringify(scanHistory, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href = url; a.download = 'lemi_history.json'; a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {t.export}
            </button>
            <button
              id="clear-history-btn"
              onClick={() => { if (window.confirm(t.clearPrompt)) clearHistory(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>{t.clearBtn}</span>
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center gap-4 py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
            <ScanLine className="w-7 h-7 text-green-500" />
          </div>
          <div>
            <p className="text-gray-700 font-bold text-base" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {t.emptyTitle}
            </p>
            <p className="text-gray-400 text-sm mt-1" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {t.emptySub}
            </p>
          </div>
          <Link href="/dashboard/scan" id="goto-scan-from-history"
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #16a34a, #65a30d)', fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
            {t.emptyBtn}
          </Link>
        </div>
      )}

      {/* History table */}
      {!isEmpty && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/80">
            {t.cols.map((h) => (
              <p key={h || 'action'}
                className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${t.colSpans[h] ?? 'col-span-1'}`}
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                {h}
              </p>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {scanHistory.map((scan, i) => {
              const st = STATUS_STYLE[scan.status] ?? STATUS_STYLE.unknown;
              const StatusIcon = st.icon;
              return (
                <div key={scan.id ?? i} id={`history-row-${i}`}
                  className="grid grid-cols-12 gap-3 px-5 py-3 items-center hover:bg-gray-50/60 transition-colors cursor-pointer"
                  onClick={() => setCurrentScan(scan)}>

                  {/* Thumbnail */}
                  <div className="col-span-1">
                    {scan.imageUrl
                      ? <img src={scan.imageUrl} alt="Scan"
                          className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }} />
                      : null}
                    <div className={`w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center ${scan.imageUrl ? 'hidden' : ''}`}>
                      <ScanLine className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>

                  {/* Plant — language-aware */}
                  <p
                    className="col-span-2 text-gray-700 text-xs font-medium truncate"
                    style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                  >
                    {localisePlant(scan, lang)}
                  </p>

                  {/* Disease — language-aware */}
                  <div className="col-span-3">
                    <p className="text-gray-800 text-xs font-semibold truncate" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                      {localiseDisease(scan, lang)}
                    </p>
                    {/* Always show the canonical English class name as a subtitle */}
                    <p className="text-gray-400 text-[10px] truncate">{scan.diseaseName}</p>
                  </div>

                  {/* Confidence bar */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${scan.confidence}%`,
                          background: scan.confidence > 80
                            ? 'linear-gradient(90deg,#16a34a,#65a30d)'
                            : scan.confidence > 50
                              ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                              : 'linear-gradient(90deg,#ef4444,#dc2626)',
                        }} />
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">{scan.confidence}%</span>
                    </div>
                  </div>

                  {/* Status icon */}
                  <div className="col-span-1">
                    <StatusIcon className={`w-4 h-4 ${st.color}`} />
                  </div>

                  {/* Date */}
                  <p className="col-span-2 text-gray-400 text-[10px]">{formatDate(scan.timestamp, lang)}</p>

                  {/* View link */}
                  <div className="col-span-1 flex justify-end">
                    <Link href="/dashboard/scan"
                      onClick={(e) => { e.stopPropagation(); setCurrentScan(scan); }}
                      className="text-[10px] text-green-600 font-semibold hover:text-green-700">›</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
