'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScanLine, History, BookOpen, Settings } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const mobileNavItems = [
  { href: '/dashboard',           icon: LayoutDashboard, id: 'mobile-nav-home',
    label: { am: 'ቤት',       or: 'Mana'    } },
  { href: '/dashboard/scan',      icon: ScanLine,        id: 'mobile-nav-scan',    isScan: true,
    label: { am: 'መርምር',    or: 'Qori'    } },
  { href: '/dashboard/history',   icon: History,         id: 'mobile-nav-history',
    label: { am: 'ታሪክ',     or: 'Seenaa'  } },
  { href: '/dashboard/treatment', icon: BookOpen,        id: 'mobile-nav-guide',
    label: { am: 'መመሪያ',   or: 'Qajeelf.' } },
  { href: '/dashboard/settings',  icon: Settings,        id: 'mobile-nav-settings',
    label: { am: 'ማስተካከያ', or: 'Qindaa.'  } },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { language } = useApp();
  const lang = language === 'or' ? 'or' : 'am';

  const isActive = (href) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
      style={{ background: '#0f2419' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.isScan) {
            return (
              <Link key={item.href} href={item.href} id={item.id} className="flex flex-col items-center -mt-6">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #65a30d)', boxShadow: '0 4px 20px rgba(22, 163, 74, 0.5)' }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[9px] mt-1 text-green-400 font-medium" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                  {item.label[lang]}
                </span>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href} id={item.id} className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all">
              <Icon className={`w-5 h-5 transition-colors ${active ? 'text-green-400' : 'text-white/40'}`} />
              <span
                className={`text-[9px] font-medium transition-colors ${active ? 'text-green-400' : 'text-white/35'}`}
                style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
              >
                {item.label[lang]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
