'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ScanLine, History, BookOpen,
  Library, WifiOff, Settings, Globe, Leaf, Cpu,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

// ─── All nav labels in both languages ────────────────────────────────────────
const navItems = [
  { href: '/dashboard',          icon: LayoutDashboard, id: 'nav-dashboard',
    label: { am: 'ዳሽቦርድ',               or: 'Dashboard'         } },
  { href: '/dashboard/scan',     icon: ScanLine,        id: 'nav-scan',
    label: { am: 'ቅጠል መርምር',           or: 'Baala Qoradhu'     } },
  { href: '/dashboard/history',  icon: History,         id: 'nav-history',
    label: { am: 'የምርመራ ታሪክ',          or: 'Seenaa Qorannoo'   } },
  { href: '/dashboard/guide',    icon: BookOpen,        id: 'nav-guide',
    label: { am: 'የህክምና መመሪያ',         or: 'Qajeelfama Yaalaa'  } },
  { href: '/dashboard/library',  icon: Library,         id: 'nav-library',
    label: { am: 'የዕፅዋት ቤተ-መፅሃፍ',      or: 'Maktaba Biqiltuu'  } },
  { href: '/dashboard/offline',  icon: WifiOff,         id: 'nav-offline',
    label: { am: 'ያለ ኢንተርኔት (Offline)', or: 'Toora Malee'       } },
  { href: '/dashboard/settings', icon: Settings,        id: 'nav-settings',
    label: { am: 'ማስተካከያዎች',            or: 'Qindaa\'ina'       } },
  { href: '/dashboard/language', icon: Globe,           id: 'nav-language',
    label: { am: 'ቋንቋ',                  or: 'Afaan'             } },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { language } = useApp();
  const lang = language === 'or' ? 'or' : 'am';

  const isActive = (href) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <aside
      className="hidden lg:flex flex-col w-64 min-h-screen flex-shrink-0"
      style={{ background: 'linear-gradient(180deg, #0f2419 0%, #1a3a2a 60%, #0f2419 100%)' }}
    >
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #16a34a, #65a30d)' }}
          >
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {lang === 'or' ? 'LEMI' : 'ለሚ'}
            </p>
            <p className="text-green-400/70 text-[10px] leading-tight">AI PLANT DISEASE DETECTOR</p>
          </div>
        </div>
        <p className="text-white/50 text-xs mt-3 leading-snug" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          {lang === 'or' ? 'Dhibee Biqiltuu Adda Baasuu' : 'የዕፅዋት በሽታ መመርመሪያ'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.id}
              className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${active ? 'active' : ''}`}
            >
              <Icon
                className={`flex-shrink-0 transition-colors ${active ? 'text-green-400' : 'text-white/45 group-hover:text-white/70'}`}
                size={18}
              />
              <span
                className={`text-sm font-medium transition-colors ${active ? 'text-white' : 'text-white/55 group-hover:text-white/80'}`}
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                {item.label[lang]}
              </span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Status indicators */}
      <div className="px-4 py-4 border-t border-white/8 space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-green-400 text-xs font-semibold" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
              {lang === 'or' ? 'Haaluma Toora Alaa' : 'ያለ ኢንተርኔት ሁነታ'}
            </p>
            <p className="text-white/40 text-[10px]">AI Model Loaded</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <div>
            <p className="text-white/70 text-xs font-medium">100%</p>
            <p className="text-white/35 text-[10px]">{lang === 'or' ? 'Meeshaan Qophaa\'e' : 'Device Ready'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
          <Cpu className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          <div>
            <p className="text-white/40 text-[10px]">Powered by Edge AI</p>
            <p className="text-white/25 text-[10px]">100% Private • Offline</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
