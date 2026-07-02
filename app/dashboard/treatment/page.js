'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Leaf, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const diseases = [
  {
    id: 'blight', class: 'Blight', icon: '🍂',
    riskLevel: 'High', riskColor: 'text-red-600', riskBg: 'bg-red-50 border-red-200',
    name:       { am: 'የቅጠል መድረቅ',          or: 'Baalaan Gogsuu'     },
    about:      { am: 'Northern Leaf Blight (NLB) በ Exserohilum turcicum ፈንጋይ የሚከሰት በሽታ ነው። ቀዝቃዛ እና እርጥብ የአየር ጠባይ ውስጥ በፍጥነት ይዛመታል።',
                  or: 'Northern Leaf Blight (NLB) Exserohilum turcicum jedhamu fangasiitiin dhufa. Haala qilleensaa qabanaa fi jiidaa keessatti saffisaan babal\'ata.' },
    symptoms:   { am: 'ከ2-15 ሳ.ሜ የሚረዝሙ ሲጋሬ ቅርጽ ያላቸው ሻካራ ቀለም ያላቸው ቀበጠ ነጠብጣቦች።',
                  or: 'Daqiiqaa 2-15 dheeraachuu danda\'u, bifni sigaaraa qabu, baalaan madaa\'a.' },
    prevention: { am: 'ተከላ ከማድረጋቸው በፊት ሜዳዎን ያጸዱ። ጠንካራ ዝርያዎችን ይጠቀሙ። ሰብሎችን ያሽከርክሩ።',
                  or: 'Dura dirree qulqulleessi. Gosoota cimoo fayyadami. Midhaan naannessi.' },
    treatment:  { am: ['Mancozeb 2.5g/L ይርጩ', 'Propiconazole-based fungicide', 'ናሙናዎቹን ያቃጥሉ'],
                  or: ['Mancozeb 2.5g/L faffaci', 'Propiconazole-based fungicide', 'Fakkeenyota guubi'] },
  },
  {
    id: 'rust', class: 'Common_Rust', icon: '🟠',
    riskLevel: 'Medium', riskColor: 'text-amber-600', riskBg: 'bg-amber-50 border-amber-200',
    name:       { am: 'የቅጠል ዝገት',             or: 'Xurrii Baalaa'      },
    about:      { am: 'Common Rust በ Puccinia sorghi ፈንጋይ የሚከሰት ሲሆን በዓለም ዙሪያ ከሚስፋፉ የበቆሎ በሽታዎች አንዱ ነው።',
                  or: 'Common Rust Puccinia sorghi jedhamu fangasiitiin dhufa, addunyaa guutuu keessatti beekama.' },
    symptoms:   { am: 'ቀይ-ቡናማ ትናንሽ አረፋ-አረፋ (pustules) ቅጠሎቹ ሁለት ጎን ላይ ይታያሉ።',
                  or: 'Madaa xixiqqaa diimaa-gurraacha (pustules) baalaa lamaan qubatu.' },
    prevention: { am: 'ቀደምት ልዩነቶችን ይትከሉ። ምርቱን ቀደም ብለው ያስወጡ።',
                  or: 'Gosoota duraa dhaabi. Midhaan hatattamaan sassaabi.' },
    treatment:  { am: ['Fungicide ቀደም ብሎ ሲሰፋ ይርጩ', 'Triazole-based fungicides', 'ክትትል ያድርጉ'],
                  or: ['Saffisa duratti fungicide faffaci', 'Triazole-based fungicides', 'Hordofuuf jiraadhu'] },
  },
  {
    id: 'gls', class: 'Gray_Leaf_Spot', icon: '🌫️',
    riskLevel: 'Medium', riskColor: 'text-amber-600', riskBg: 'bg-amber-50 border-amber-200',
    name:       { am: 'ግራጫ የቅጠል ነጠብጣብ',      or: 'Dhibee Garaa Baalaa' },
    about:      { am: 'Gray Leaf Spot (GLS) በ Cercospora zeae-maydis የሚከሰት ሲሆን ምርት ላይ ከፍተኛ ጉዳት ያደርሳል።',
                  or: 'Gray Leaf Spot (GLS) Cercospora zeae-maydis\'tiin dhufa, midhaan irratti miidhaa guddaa geessisa.' },
    symptoms:   { am: 'ጠባብ፣ አራት ማዕዘን ቅርጽ ያላቸው ቀላ ወደ ግራጫ ቀለም ያላቸው ቆስቋሳዎች።',
                  or: 'Madaa dhiphaa, afuura arba qabu, bifni diimaa gara garaa jijjirama.' },
    prevention: { am: 'የሰብል ቅሪት ያስወጡ። ክፍት-አየር ስርዓቶችን ይጠቀሙ።',
                  or: 'Hafaatota midhaan balleessi. Sirnota qilleensa banaa fayyadami.' },
    treatment:  { am: ['Azoxystrobin fungicide', 'ሰብሎችን ያሽከርክሩ', 'ቅሪቶችን ቀቅለው ያስወጡ'],
                  or: ['Azoxystrobin fungicide', 'Midhaan naannessi', 'Hafaatota manca\'i'] },
  },
  {
    id: 'healthy', class: 'Healthy', icon: '🌿',
    riskLevel: 'Low', riskColor: 'text-green-600', riskBg: 'bg-green-50 border-green-200',
    name:       { am: 'ጤናማ ቅጠል',               or: 'Baala Fayyaa'       },
    about:      { am: 'ዕፅዋቱ ጤናማ ሆኖ ተገኝቷል። ምንም ዓይነት የበሽታ ምልክት አልታየም።',
                  or: 'Biqiltuun fayyaa ta\'uun argame. Mallattoo dhibee kamiiyyu hin mul\'anne.' },
    symptoms:   { am: 'ምልክት የለም። ቅጠሎቹ አረንጓዴ ናቸው።',
                  or: 'Mallattoo hin jiru. Baalli magariisa.' },
    prevention: { am: 'ምርጥ የእርሻ ዘዴዎችን ይቀጥሉ። ወቅታዊ ምርመራ ያድርጉ።',
                  or: 'Hojii qonnaa gaggaarii itti fufi. Yeroo yeroon qori.' },
    treatment:  { am: ['ምንም ህክምና አያስፈልግም', 'ቀጣይ ክትትል ያድርጉ', 'ሥርዓትን ጠብቁ'],
                  or: ['Yaaliin hin barbaachisu', 'Hordoffii itti fufi', 'Sirna eegi'] },
  },
];

const LABELS = {
  am: { header: 'የህክምና መምሪያ', sub: 'LEMI AI ለሚለዩት 4 የቆሎ በሽታዎች ዝርዝር መረጃ እና ህክምና ያግኙ። ካርዱን ጠቅ ያድርጉ።',
        about: 'ስለ በሽታው', symptoms: 'ምልክቶች', prevention: 'መከላከያ', treatment: 'ህክምና' },
  or: { header: 'Qajeelfama Yaalaa', sub: 'LEMI AI\'n dhibeewwan boqqolloo 4 adda baasuu irratti odeeffannoo argadhu. Kaardii tuqi.',
        about: 'Dhibee Waa\'ee', symptoms: 'Mallattoo', prevention: 'Ittisuu', treatment: 'Yaalii' },
};

function DiseaseCard({ disease, lang }) {
  const [open, setOpen] = useState(false);
  const lbl = LABELS[lang];
  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${disease.riskBg}`} id={`disease-${disease.id}`}>
      <button className="w-full flex items-center justify-between px-5 py-4 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{disease.icon}</span>
          <div>
            <p className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {disease.name[lang]}
            </p>
            <p className="text-gray-500 text-xs">{disease.class}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${disease.riskColor}`}>{disease.riskLevel}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/60">
          {[
            { key: 'about',      label: lbl.about,      icon: Info,         text: disease.about[lang]       },
            { key: 'symptoms',   label: lbl.symptoms,   icon: AlertCircle,  text: disease.symptoms[lang]    },
            { key: 'prevention', label: lbl.prevention, icon: Leaf,         text: disease.prevention[lang]  },
          ].map(({ key, label, icon: Icon, text }) => (
            <div key={key} className="pt-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide"
                   style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>{label}</p>
              </div>
              <p className="text-gray-700 text-xs leading-relaxed" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>{text}</p>
            </div>
          ))}
          <div className="pt-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2"
               style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>{lbl.treatment}</p>
            <ul className="space-y-1">
              {disease.treatment[lang].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-xs" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TreatmentPage() {
  const { language } = useApp();
  const lang = language === 'or' ? 'or' : 'am';
  const lbl  = LABELS[lang];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
            {lbl.header}
          </p>
          <p className="text-gray-500 text-xs mt-0.5 leading-relaxed" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
            {lbl.sub}
          </p>
        </div>
      </div>
      {diseases.map((d) => <DiseaseCard key={d.id} disease={d} lang={lang} />)}
    </div>
  );
}
