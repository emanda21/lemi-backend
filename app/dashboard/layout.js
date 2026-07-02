'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import DashboardHeader from '@/components/DashboardHeader';

/**
 * Shared layout for every page under /dashboard.
 *
 * Route Guard Logic:
 * 1. Read `auth_token` from localStorage.
 * 2. If no token exists → redirect to / immediately.
 * 3. If a token exists → verify it against /api/auth/verify (which proxies
 *    to the FastAPI /verify endpoint).
 *    • Valid   → allow access, render children.
 *    • Invalid → clear stale token from storage, redirect to /.
 *    • Backend unreachable (soft-pass) → allow access temporarily so users
 *      aren't ejected during a Render cold-start / intermittent failure.
 */
export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verifyAuth() {
      // Step 1: Token presence check (fast, synchronous)
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('[DashboardLayout] No auth_token found — redirecting to login.');
        router.replace('/');
        return;
      }

      // Step 2: Token validity check (calls Next.js API proxy → FastAPI /verify)
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (cancelled) return;

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.valid === false) {
            // Server explicitly told us the token is invalid
            console.warn('[DashboardLayout] Token rejected by server — clearing and redirecting.');
            localStorage.removeItem('auth_token');
            router.replace('/');
            return;
          }
          // Token valid (or soft-pass due to backend being offline)
          setIsAuthChecking(false);
        } else if (res.status === 401) {
          // Token is definitely bad
          console.warn('[DashboardLayout] 401 from /verify — clearing token and redirecting.');
          localStorage.removeItem('auth_token');
          router.replace('/');
        } else {
          // 500, 503, etc. — backend error, give benefit of the doubt
          console.warn(`[DashboardLayout] /verify returned ${res.status} — allowing access (soft-pass).`);
          setIsAuthChecking(false);
        }
      } catch (err) {
        if (cancelled) return;
        // Network-level failure — allow access rather than locking users out
        console.warn('[DashboardLayout] Could not reach /verify (network error):', err.message);
        setIsAuthChecking(false);
      }
    }

    verifyAuth();
    return () => { cancelled = true; };
  }, [router]);

  // Show nothing while verifying (prevents flash of protected content)
  if (isAuthChecking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-light, #f9fafb)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-green-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
            እያረጋገጡ ነው...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="dashboard-bg flex min-h-screen transition-colors duration-300"
      style={{ background: 'var(--bg-light)', fontFamily: "'Inter', 'Noto Sans Ethiopic', sans-serif" }}
    >
      {/* Sidebar – desktop only */}
      <Sidebar />

      {/* Content column */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />

        {/* Scrollable page area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Bottom nav – mobile only */}
      <MobileNav />
    </div>
  );
}
