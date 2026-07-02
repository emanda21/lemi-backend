import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata = {
  title: 'ለሚ AI - የዕፅዋት በሽታ መመርመሪያ',
  description: 'ያለ ኢንተርኔት የሚሰራ፣ ብዙ ቋንቋ የሚደግፍ የዕፅዋት በሽታ ምርመራ ስርዓት',
  keywords: 'LEMI AI, plant disease, Ethiopia, offline, edge AI',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple:    '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="am" suppressHydrationWarning>
      <head>
        {/*
          Blocking inline script: runs before CSS paints — reads the saved
          theme from localStorage and immediately adds 'dark' to <html>.
          This eliminates the flash-of-white on page load.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('lemi_theme');
                if (t === 'dark') document.documentElement.classList.add('dark');
              } catch(e) {}
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Ethiopic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {/* AppProvider gives every page access to currentScan, scanHistory, isLoading, error */}
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

