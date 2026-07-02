'use client';

import { Sun, Moon, Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';

// Amharic label map
const PAGE_TITLES_AM = {
  '/dashboard':           { am: 'ዋና ገጽ',            or: 'Mana Jalqabaa' },
  '/dashboard/scan':      { am: 'ቅጠል መርምር',          or: 'Baala Qoradhu'  },
  '/dashboard/history':   { am: 'የምርመራ ታሪክ',         or: 'Seenaa Qorannoo' },
  '/dashboard/guide':     { am: 'የህክምና መመሪያ',        or: 'Qajeelfama Yaalaa' },
  '/dashboard/treatment': { am: 'የህክምና መመሪያ',        or: 'Qajeelfama Yaalaa' },
  '/dashboard/library':   { am: 'የዕፅዋት ቤተ-መፅሃፍ',     or: 'Maktaba Biqiltuu'  },
  '/dashboard/offline':   { am: 'ያለ ኢንተርኔት ሁነታ',    or: 'Haaluma Toora Alaa' },
  '/dashboard/settings':  { am: 'ማስተካከያዎች',           or: 'Qindaa\'ina'       },
  '/dashboard/language':  { am: 'ቋንቋ ምረጥ',           or: 'Afaan Filadhu'     },
};

// Language display names + STT lang codes
const LANG_META = {
  am: { display: 'አማርኛ', flag: '🇪🇹', next: 'Af Oromoo' },
  or: { display: 'Af Oromoo', flag: '🇪🇹', next: 'አማርኛ' },
};

export default function DashboardHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme, language, toggleLanguage } = useApp();

  const titles = PAGE_TITLES_AM[pathname] ?? PAGE_TITLES_AM['/dashboard'];
  const title  = language === 'or' ? titles.or : titles.am;
  const lang   = LANG_META[language] ?? LANG_META.am;

  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md transition-colors">

      {/* Mobile: LEMI brand */}
      <div className="flex items-center gap-2 lg:hidden">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #16a34a, #65a30d)' }}
        >
          <span className="text-white text-xs font-black">L</span>
        </div>
        <span
          className="text-gray-800 dark:text-gray-100 font-bold text-sm"
          style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
        >
          ለሚ AI
        </span>
      </div>

      {/* Desktop: page title */}
      <div className="hidden lg:block">
        <h1
          className="text-gray-800 dark:text-gray-100 font-bold text-base leading-tight"
          style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
        >
          {title}
        </h1>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">

        {/* Language toggle */}
        <button
          id="header-language-toggle"
          onClick={toggleLanguage}
          title={`Switch to ${lang.next}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          <span
            className="text-gray-700 dark:text-gray-200 text-xs font-semibold"
            style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
          >
            {lang.flag} {lang.display}
          </span>
        </button>

        {/* Dark / light mode toggle */}
        <button
          id="header-theme-toggle"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark
            ? <Sun  className="w-4 h-4 text-amber-400" />
            : <Moon className="w-4 h-4 text-gray-500" />
          }
        </button>
      </div>
    </header>
  );
}
