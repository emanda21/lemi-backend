'use client';

import Link from 'next/link';
import { Camera } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const T = {
  am: {
    line1: 'መርምር።',
    line2: 'እወቅ። ፈውስ།',
    line3: 'ተንከባከብ።',
    sub:   'ለጤናማ ዕፅዋት — AI ሀይል ያለው ምርመራ',
    btn:   'ቅጠል መርምር',
  },
  or: {
    line1: 'Qori.',
    line2: 'Beeki. Fayyisi.',
    line3: 'Kunuunsi.',
    sub:   'Biqiltuuf fayyaa — Qorannoo humna AI',
    btn:   'Baala Qoradhu',
  },
};

export default function HeroBanner() {
  const { language } = useApp();
  const t = language === 'or' ? T.or : T.am;

  return (
    <div
      className="relative rounded-2xl overflow-hidden min-h-[220px] flex items-center"
      style={{ background: 'linear-gradient(135deg, #0f2419 0%, #1a3a2a 50%, #2d5a3d 100%)' }}
    >
      {/* Decorative leaf image overlay */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-center opacity-30 rounded-r-2xl"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1592022359155-a570e7645855?w=800&q=80'), url('/leaf1.jpg')" }}
      />
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-transparent to-[#1a3a2a]" />

      {/* Scan corner brackets */}
      <div className="absolute right-6 top-6 w-24 h-24 scan-corner pointer-events-none hidden sm:block">
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-green-400 rounded-tl" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-green-400 rounded-tr" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-green-400 rounded-bl" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-green-400 rounded-br" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-7 py-8 max-w-sm">
        <h2 className="text-white text-3xl sm:text-4xl font-extrabold leading-tight mb-1"
            style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          {t.line1}
        </h2>
        <h2 className="text-white text-3xl sm:text-4xl font-extrabold leading-tight mb-1"
            style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          {t.line2}
        </h2>
        <h2 className="text-green-400 text-3xl sm:text-4xl font-extrabold leading-tight mb-4"
            style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          {t.line3}
        </h2>
        <p className="text-white/60 text-sm mb-6"
           style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
          {t.sub}
        </p>
        <Link
          href="/dashboard/scan"
          id="hero-scan-btn"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #16a34a, #65a30d)',
            boxShadow: '0 4px 18px rgba(22, 163, 74, 0.45)',
            fontFamily: "'Noto Sans Ethiopic', sans-serif",
          }}
        >
          <Camera className="w-4 h-4" />
          {t.btn}
        </Link>
      </div>
    </div>
  );
}
