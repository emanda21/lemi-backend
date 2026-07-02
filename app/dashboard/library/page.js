'use client';

import { Leaf, ScanLine, Download, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

const T = {
  am: {
    header:      'የዕፅዋት ቤተ-መፅሃፍ',
    headerSub:   'LEMI AI ያሁን ላይ ለሚደግፋቸው ዕፅዋቶች ዝርዝር መረጃ ያገኛሉ። ሌሎች ዕፅዋቶች በቀጣይ ስሪቶች ይጨምራሉ።',
    manualTitle: '📖 የበቆሎ ሰብል አመራረት መመሪያ',
    manualDesc:  'ይህ መመሪያ ከኢትዮጵያ ግብርና ሚኒስቴር የተዘጋጀ ሲሆን በዝናብና በመስኖ ስለሚደረግ የበቆሎ ሰብል አመራረት፣ የበሽታ አያያዝና መከላከያ ዘዴዎችን በዝርዝር ያካትታል። ለገበሬዎች፣ ለግብርና ባለሙያዎችና ለተማሪዎች ጠቃሚ ነው።',
    downloadBtn: 'መጽሐፉን አውርድ',
    scanBtn:     'አሁን ምርምር',
    detectable:  'Detectable Diseases',
  },
  or: {
    header:      'Maktaba Biqiltuu',
    headerSub:   'LEMI AI biqiltoota amma deggeru irratti odeeffannoo argadhu. Biqiltoonni biroo gara fuulduraatti ni dabalamu.',
    manualTitle: '📖 Qajeelfama Qonna Boqqolloo',
    manualDesc:  'Qajeelfamni kun Ministeera Qonnaa Itoophiyaa irraa kan qophaaye yoo ta\'u, qonna boqqolloo rooba fi jallisiin, too\'annaa dhibee fi mala ittisuu irratti xiyyeeffata. Qonnaan bultoota, ogeeyyota qonnaa fi barattoota bira gahuu danda\'a.',
    downloadBtn: 'Kitaaba Buufadhu',
    scanBtn:     'Amma Qori',
    detectable:  'Dhibeewwan Adda Baafaman',
  },
};

const plants = [
  {
    id: 'corn', emoji: '🌽',
    name:        { am: 'በቆሎ',    or: 'Boqqolloo'  },
    nameEn:      'Corn / Maize',
    diseases:    ['Blight', 'Common Rust', 'Gray Leaf Spot'],
    supported:   true,
    description: { am: 'LEMI AI ለበቆሎ ቅጠሎች 4 የተለያዩ ሁኔታዎችን መመርመር ይችላል።',
                   or: 'LEMI AI baala boqqolloo irratti haala 4 adda baasuu danda\'a.' },
    color: 'from-yellow-50 to-amber-50', border: 'border-amber-200',
    badge: 'bg-green-100 text-green-700',
    badgeText: { am: 'ድጋፍ አለ', or: 'Deggersa Jira' },
  },
  {
    id: 'tomato', emoji: '🍅',
    name:        { am: 'ቲማቲም',  or: 'Toomaatii'  },
    nameEn:      'Tomato',
    diseases:    ['Late Blight', 'Early Blight', 'Leaf Mold'],
    supported:   false,
    description: { am: 'የቲማቲም ምርመራ በቀጣይ ስሪት ይታከላል።',
                   or: 'Qorannoo toomaatii gara fuulduraatti ni dabalama.' },
    color: 'from-red-50 to-pink-50', border: 'border-red-100',
    badge: 'bg-gray-100 text-gray-500',
    badgeText: { am: 'በቅርቡ', or: 'Dhiyoo' },
  },
  {
    id: 'wheat', emoji: '🌾',
    name:        { am: 'ስንዴ',   or: 'Qamadii'    },
    nameEn:      'Wheat',
    diseases:    ['Stem Rust', 'Leaf Rust', 'Septoria'],
    supported:   false,
    description: { am: 'የስንዴ ምርመራ ሞዴል ዝግጅት ላይ ነው።',
                   or: 'Modelli qorannoo qamadii qophaa\'a jira.' },
    color: 'from-amber-50 to-yellow-50', border: 'border-amber-200',
    badge: 'bg-gray-100 text-gray-500',
    badgeText: { am: 'በቅርቡ', or: 'Dhiyoo' },
  },
  {
    id: 'onion', emoji: '🧅',
    name:        { am: 'ሽንኩርት', or: 'Qullubbii'  },
    nameEn:      'Onion',
    diseases:    ['Purple Blotch', 'Downy Mildew', 'Botrytis'],
    supported:   false,
    description: { am: 'የሽንኩርት ምርመራ ወደፊት ይቻላል።',
                   or: 'Qorannoo qullubbii gara fuulduraatti ni danda\'ama.' },
    color: 'from-violet-50 to-purple-50', border: 'border-violet-100',
    badge: 'bg-gray-100 text-gray-500',
    badgeText: { am: 'በቅርቡ', or: 'Dhiyoo' },
  },
];

export default function LibraryPage() {
  const { language } = useApp();
  const t    = language === 'or' ? T.or : T.am;
  const lang = language === 'or' ? 'or' : 'am';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Intro card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3">
        <Leaf className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
            {t.header}
          </p>
          <p className="text-gray-500 text-xs mt-0.5 leading-relaxed" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
            {t.headerSub}
          </p>
        </div>
      </div>

      {/* Ministry of Agriculture Corn Manual */}
      <div id="corn-manual-section"
        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-sm p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #16a34a, #065f46)' }}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {t.manualTitle}
            </p>
            <p className="text-gray-600 text-xs mt-1 leading-relaxed" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {t.manualDesc}
            </p>
          </div>
        </div>
        <a href="/corn_manual.pdf" download id="download-corn-manual-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #16a34a, #065f46)', boxShadow: '0 4px 16px rgba(22,163,74,0.3)', fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          <Download className="w-4 h-4" />
          {t.downloadBtn}
        </a>
      </div>

      {/* Plant grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plants.map((plant) => (
          <div key={plant.id} id={`plant-${plant.id}`}
            className={`bg-gradient-to-br ${plant.color} rounded-2xl border ${plant.border} shadow-sm p-5 space-y-3`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{plant.emoji}</span>
                <div>
                  <p className="font-bold text-gray-800 text-base" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                    {plant.name[lang]}
                  </p>
                  <p className="text-gray-500 text-xs">{plant.nameEn}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${plant.badge}`}
                    style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                {plant.badgeText[lang]}
              </span>
            </div>

            <p className="text-gray-600 text-xs leading-relaxed" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {plant.description[lang]}
            </p>

            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t.detectable}</p>
              <div className="flex flex-wrap gap-1">
                {plant.diseases.map((d) => (
                  <span key={d} className="px-2 py-0.5 bg-white/70 rounded-full text-[10px] text-gray-600 border border-gray-200">{d}</span>
                ))}
              </div>
            </div>

            {plant.supported && (
              <Link href="/dashboard/scan"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #16a34a, #65a30d)', fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                <ScanLine className="w-3.5 h-3.5" />
                {t.scanBtn}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
