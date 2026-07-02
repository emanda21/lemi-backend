'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Leaf, UserPlus, LogIn, CheckCircle, AlertCircle, X } from 'lucide-react';

// ─── Toast Component ────────────────────────────────────────────────────────
function Toast({ type, message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isSuccess = type === 'success';
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl max-w-sm w-full animate-slide-in`}
      style={{
        background: isSuccess ? 'rgba(22,163,74,0.92)' : 'rgba(220,38,38,0.92)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isSuccess ? 'rgba(74,222,128,0.4)' : 'rgba(252,165,165,0.4)'}`,
      }}
    >
      {isSuccess
        ? <CheckCircle className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
        : <AlertCircle className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />}
      <p className="text-white text-sm font-medium flex-1" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
        {message}
      </p>
      <button onClick={onDismiss} className="text-white/70 hover:text-white transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Input field helper ─────────────────────────────────────────────────────
function GlassInput({ id, type, value, onChange, placeholder, icon: Icon, required }) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        className="glass-input w-full rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder-white/40 outline-none"
        placeholder={placeholder}
        style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
        required={required}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
      />
      <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  // ── View toggle ──────────────────────────────────────────────────────────
  const [isSignUp, setIsSignUp] = useState(false);

  // ── Shared fields ─────────────────────────────────────────────────────────
  // `name` is the sole identifier for both Sign-In (username) and Sign-Up.
  // Email has been removed from the entire auth flow.
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Sign-in only ─────────────────────────────────────────────────────────
  const [rememberMe, setRememberMe] = useState(false);

  // ── Sign-up only ─────────────────────────────────────────────────────────
  const [confirmPassword, setConfirm] = useState('');

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type, message }

  const showToast = (type, message) => setToast({ type, message });
  const clearToast = () => setToast(null);

  // Reset fields when switching modes
  const switchMode = (toSignUp) => {
    setIsSignUp(toSignUp);
    setName('');
    setPassword('');
    setConfirm('');
    setShowPassword(false);
    setShowConfirm(false);
    clearToast();
  };

  // ── Sign-In handler — sends { name, password } only ─────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    clearToast();

    if (!name.trim()) {
      showToast('error', 'እባክዎ ስምዎን ያስገቡ / Maaloo maqaa keessan galchaa.');
      return;
    }
    if (!password) {
      showToast('error', 'እባክዎ የይለፍ ቃሉን ያስገቡ / Maaloo jecha darbii galchaa.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      // ── 401 Unauthorized — wrong username or password ──────────────────
      if (response.status === 401) {
        console.warn('[Login] 401 Unauthorized — invalid credentials for user:', name.trim());
        showToast('error', data?.message ?? 'የይለፍ ቃል ተሳስቷል። ድጋሚ ይሞክሩ። / Jecha darbii dogoggore. Deebi\'i yaali.');
        return;
      }

      // ── Non-OK response (503 backend down, 500 server error, etc.) ────────
      if (!response.ok) {
        console.error(`[Login] HTTP ${response.status} error:`, data);
        showToast('error', data?.message ?? `ስህተት ተፈጠረ (HTTP ${response.status}). ድጋሚ ይሞክሩ።`);
        return;
      }

      // ── Success — validate token then redirect ─────────────────────────
      const token = data?.token;
      if (!token) {
        console.error('[Login] Server returned 200 but no auth token in response:', data);
        showToast('error', 'ከሰርቨሩ ምላሽ ስህተት ተፈጠረ። ድጋሚ ይሞክሩ።');
        return;
      }

      // Persist token, then navigate to dashboard
      localStorage.setItem('auth_token', token);
      if (rememberMe) {
        localStorage.setItem('lemi_remember_me', name.trim());
      }
      router.push('/dashboard');
    } catch (error) {
      // True network failure (no internet, CORS pre-flight blocked, etc.)
      console.error('[Login] Network error — full details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      showToast('error', 'ወደ አካውንትዎ መግባት አልተቻለም። ኢንተርኔት ያረጋግጡ ወይም ድጋሚ ይሞክሩ።');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Sign-Up handler — sends { name, password } only ────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    clearToast();

    // Client-side validation (no email required)
    if (!name.trim()) {
      showToast('error', 'እባክዎ ስምዎን ያስገቡ / Maaloo maqaa keessan galchaa.');
      return;
    }
    if (password.length < 6) {
      showToast('error', 'የይለፍ ቃሉ ቢያንስ 6 ቁጥር መሆን አለበት / Jecha darbii xiqqaatee qubee 6 qabaachuu qaba.');
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', 'የይለፍ ቃሉ አይዛመድም / Jecha darbiin wal hin simu.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.success !== false) {
        showToast('success', data?.message ?? 'ምዝገባ ተሳክቷል! ይግቡ / Galmeessuun milkaa\'e! Seenaa.');
        // Auto-switch to login after a brief delay
        setTimeout(() => {
          switchMode(false);
        }, 2000);
      } else {
        const msg = data?.message ?? `ምዝገባ አልተሳካም (HTTP ${response.status})`;
        console.warn(`[Register] HTTP ${response.status} failure:`, data);
        showToast('error', msg);
      }
    } catch (error) {
      // Log the exact network/HTTP error to console for debugging
      console.error('[Register] Network error — full details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      showToast('error', 'ከ AI ሰርቨሩ ጋር ግንኙነት አልተቻለም። ኢንተርኔት ያረጋግጡ ወይም ድጋሚ ይሞክሩ።');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Toast notifications */}
      {toast && <Toast type={toast.type} message={toast.message} onDismiss={clearToast} />}

      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/login_bg.jpg'), url('https://images.unsplash.com/photo-1580407196238-dac33f57c410?w=1920&q=85')",
        }}
      >
        <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
      </div>

      {/* Floating particles / bokeh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-green-400/10 blur-2xl"
            style={{
              width: `${100 + i * 60}px`,
              height: `${100 + i * 60}px`,
              top: `${10 + i * 14}%`,
              left: `${5 + i * 15}%`,
              animation: `pulse-scan ${3 + i}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div
          className="glass-card rounded-3xl p-8 sm:p-10 shadow-2xl"
          style={{
            boxShadow: '0 25px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.13)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-lime-400 flex items-center justify-center shadow-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase">LEMI AI</p>
          </div>

          {/* Mode toggle tabs */}
          <div className="flex rounded-2xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <button
              type="button"
              id="tab-signin"
              onClick={() => switchMode(false)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all duration-200 ${!isSignUp
                ? 'text-white rounded-xl'
                : 'text-white/50 hover:text-white/80'
                }`}
              style={!isSignUp ? { background: 'linear-gradient(135deg, #16a34a 0%, #65a30d 100%)' } : {}}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>ይግቡ</span>
            </button>
            <button
              type="button"
              id="tab-signup"
              onClick={() => switchMode(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all duration-200 ${isSignUp
                ? 'text-white rounded-xl'
                : 'text-white/50 hover:text-white/80'
                }`}
              style={isSignUp ? { background: 'linear-gradient(135deg, #16a34a 0%, #65a30d 100%)' } : {}}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>ይመዝገቡ</span>
            </button>
          </div>

          {/* Heading */}
          <h1 className="text-white text-3xl font-bold mb-1" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
            {isSignUp ? 'አካውንት ይፍጠሩ' : 'ይግቡ'}
          </h1>
          <p className="text-white/65 text-sm mb-7 leading-relaxed" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
            {isSignUp
              ? 'አዲስ LEMI AI አካውንት ለመፍጠር ይመዝገቡ'
              : 'እንኳን ደህና መጡ፣ እባክዎ ወደ አካውንትዎ ይግቡ'}
          </p>

          {/* ══════════════ SIGN-IN FORM ══════════════ */}
          {!isSignUp && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Full Name / Username — no email */}
              <GlassInput
                id="username"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ሙሉ ስም / Maqaa Guutuu"
                icon={User}
                required
              />

              {/* Password */}
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder-white/40 outline-none"
                  placeholder="የይለፍ ቃል"
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  id="remember-me-toggle"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                  {rememberMe ? (
                    <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded border border-white/40 flex-shrink-0" />
                  )}
                  <span className="text-sm" style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}>
                    አስታውሰኝ
                  </span>
                </button>
              </div>

              {/* Login button */}
              <button
                id="login-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-bold text-white text-base mt-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #16a34a 0%, #65a30d 100%)',
                  boxShadow: '0 4px 20px rgba(22, 163, 74, 0.4)',
                  fontFamily: "'Noto Sans Ethiopic', sans-serif",
                }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>እየገቡ ነው...</span>
                  </>
                ) : 'ይግቡ'}
              </button>
            </form>
          )}

          {/* ══════════════ SIGN-UP FORM ══════════════ */}
          {isSignUp && (
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Full name */}
              <GlassInput
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ሙሉ ስም / Maqaa Guutuu"
                icon={User}
                required
              />


              {/* Password */}
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder-white/40 outline-none"
                  placeholder="የይለፍ ቃል (ቢያንስ 6 ቁጥር)"
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  id="signup-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="glass-input w-full rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder-white/40 outline-none"
                  placeholder="የይለፍ ቃሉን ያረጋግጡ / Jecha darbii mirkaneessi"
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Inline password match indicator */}
              {confirmPassword && (
                <p
                  className={`text-xs px-1 -mt-1 ${password === confirmPassword ? 'text-green-400' : 'text-red-400'}`}
                  style={{ fontFamily: "'Noto Sans Ethiopic', sans-serif" }}
                >
                  {password === confirmPassword
                    ? '✓ የይለፍ ቃሉ ተዛምዷል'
                    : '✗ የይለፍ ቃሉ አይዛመድም'}
                </p>
              )}

              {/* Register button */}
              <button
                id="signup-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-bold text-white text-base mt-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #16a34a 0%, #65a30d 100%)',
                  boxShadow: '0 4px 20px rgba(22, 163, 74, 0.4)',
                  fontFamily: "'Noto Sans Ethiopic', sans-serif",
                }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>እየተመዘገቡ ነው...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>ይመዝገቡ</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-white/30 text-xs mt-6">
            Powered by{' '}
            <span className="italic font-medium text-white/40">LEMI AI</span>
          </p>
        </div>
      </div>
    </div>
  );
}
