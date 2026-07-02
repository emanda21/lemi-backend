'use client';

import { Globe, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const languages = [
  { code: 'am', name: 'አማርኛ',       native: 'Amharic',      flag: '🇪🇹', region: 'Ethiopia', supported: true },
  { code: 'or', name: 'Afaan Oromoo', native: 'Oromo',         flag: '🇪🇹', region: 'Ethiopia', supported: true },
];

// UI strings for both languages
const UI = {
  am: {
    header:    'ቋንቋ ምረጥ',
    subtitle:  'LEMI AI ያሁን አማርኛ እና Afaan Oromoo ሙሉ ድጋፍ አለው።',
    saveBtn:   'ቋንቋ አስቀምጥ',
    saved:     'ቋንቋ ተቀይሯል',
  },
  or: {
    header:    'Afaan Filadhu',
    subtitle:  'LEMI AI Afaan Oromoo fi Amaariffaa guutummaatti deggera.',
    saveBtn:   'Afaan Olkaa\'i',
    saved:     'Afaan jijjiirame',
  },
};

export default function LanguagePage() {
  const { language, setVoiceTranscription, toggleLanguage } = useApp();

  // Derive the currently selected code from global state
  const selected = language;
  const ui = UI[language] ?? UI.am;

  const handleSelect = (code) => {
    if (code !== language) toggleLanguage(); // toggleLanguage cycles am ↔ or
  };

  const handleSave = () => {
    // Language is already persisted via AppContext → localStorage on every toggleLanguage call.
    alert(`${ui.saved}: ${languages.find(l => l.code === selected)?.name}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3">
        <Globe className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
            {ui.header}
          </p>
          <p className="text-gray-500 text-xs mt-0.5 leading-relaxed" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
            {ui.subtitle}
          </p>
        </div>
      </div>

      {/* Language grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {languages.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <button
              key={lang.code}
              id={`lang-${lang.code}`}
              onClick={() => handleSelect(lang.code)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-green-200 hover:bg-green-50/30'
              }`}
            >
              <span className="text-3xl flex-shrink-0">{lang.flag}</span>
              <div className="flex-1 min-w-0">
                <p
                  className="font-bold text-gray-800 text-sm truncate"
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                >
                  {lang.name}
                </p>
                <p className="text-gray-400 text-xs">{lang.native} • {lang.region}</p>
              </div>
              {isSelected && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Save button */}
      <button
        id="save-language-btn"
        className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, #16a34a, #65a30d)',
          fontFamily: "'Noto Sans Ethiopic', sans-serif",
        }}
        onClick={handleSave}
      >
        {ui.saveBtn}
      </button>
    </div>
  );
}
