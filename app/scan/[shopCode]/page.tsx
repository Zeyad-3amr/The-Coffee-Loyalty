'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { validateEgyptPhoneNumber, formatPhoneNumber, isRewardExpired } from '@/app/lib/utils';
import { deriveBrandRamp, isValidHex, INK_FOR, normalizeTextMode, cardCssVars } from '@/app/lib/theme';
import { ErrorDisplay } from '@/app/components/ErrorDisplay';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';

interface ScanPageProps {
  params: {
    shopCode: string;
  };
}

type PageState = 'input' | 'confirm' | 'loading' | 'success' | 'reward' | 'cooldown' | 'error';

interface ApiResponse {
  success?: boolean;
  error?: string;
  stampCount?: number;
  rewardActive?: boolean;
  rewardExpiresAt?: string;
  passUrl?: string;
  message?: string;
}

function ScanLogic({ shopCode }: { shopCode: string }) {
  const searchParams = useSearchParams();
  const t = searchParams ? searchParams.get('t') : null;
  const s = searchParams ? searchParams.get('s') : null;
  const [pageState, setPageState] = useState<PageState>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [now, setNow] = useState<number>(() => Date.now());
  const [stampCount, setStampCount] = useState(0);
  const [rewardActive, setRewardActive] = useState(false);
  const [rewardExpiresAt, setRewardExpiresAt] = useState<Date | null>(null);
  const [passUrl, setPassUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shopData, setShopData] = useState<{name: string, logoUrl: string|null, brandColor?: string|null, bgColor?: string|null, textColor?: string|null} | null>(null);

  // Repaint the accent to the shop's brand color across every scan state.
  useEffect(() => {
    const color = shopData?.brandColor;
    if (!color) return;
    const ramp = deriveBrandRamp(color);
    const root = document.documentElement;
    Object.entries(ramp).forEach(([s, v]) => root.style.setProperty(`--brand-${s}`, v));
    return () => Object.keys(ramp).forEach((s) => root.style.removeProperty(`--brand-${s}`));
  }, [shopData?.brandColor]);

  // Apply the shop's page background + text color, and the derived card surface.
  useEffect(() => {
    if (!shopData) return;
    const root = document.documentElement;
    const set: string[] = [];
    const put = (k: string, v: string) => { root.style.setProperty(k, v); set.push(k); };
    if (shopData.bgColor && isValidHex(shopData.bgColor)) put('--page-bg', shopData.bgColor);
    put('--page-ink', INK_FOR[normalizeTextMode(shopData.textColor)]);
    // Card surface vars derived from bg + text mode.
    cardCssVars(shopData.bgColor, shopData.textColor)
      .split(';')
      .filter(Boolean)
      .forEach((decl) => { const i = decl.indexOf(':'); put(decl.slice(0, i), decl.slice(i + 1)); });
    return () => set.forEach((k) => root.style.removeProperty(k));
  }, [shopData?.bgColor, shopData?.textColor]);

  useEffect(() => {
    // Prevent device-level scan abuse across all numbers
    const lastDeviceScan = localStorage.getItem(`device_scan_${shopCode}`);
    if (lastDeviceScan) {
      const timeSince = Date.now() - parseInt(lastDeviceScan, 10);
      if (timeSince < 7 * 60 * 1000) {
        setPageState('cooldown');
        return;
      }
    }

    fetch(`/api/shop/code/${shopCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.shop) setShopData(data.shop);
      })
      .catch(console.error);
  }, [shopCode]);

  useEffect(() => {
    const stored = sessionStorage.getItem(`reward_${shopCode}`);
    if (stored) {
      const data = JSON.parse(stored);
      if (!isRewardExpired(data.expiresAt)) {
        setRewardActive(true);
        setRewardExpiresAt(new Date(data.expiresAt));
        setPageState('reward');
      }
    }
  }, [shopCode]);

  // Tick once per second while showing the reward, for the countdown.
  useEffect(() => {
    if (pageState !== 'reward') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [pageState]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhoneNumber(value);
    setPhoneError('');
  };

  const handlePhoneSubmit = () => {
    const validation = validateEgyptPhoneNumber(phoneNumber);
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Invalid phone number');
      return;
    }
    setPhoneError('');
    setPageState('confirm');
  };

  const handleEdit = () => {
    setPhoneNumber('');
    setPageState('input');
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, shopCode, t, s }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setPageState('cooldown');
        } else {
          setError(data.error || 'Something went wrong, please try again');
          setPageState('error');
        }
        return;
      }

      if (data.rewardActive) {
        sessionStorage.setItem(
          `reward_${shopCode}`,
          JSON.stringify({ expiresAt: data.rewardExpiresAt })
        );
        localStorage.setItem(`device_scan_${shopCode}`, Date.now().toString());
        setRewardActive(true);
        setRewardExpiresAt(new Date(data.rewardExpiresAt!));
        if (data.passUrl) setPassUrl(data.passUrl);
        setPageState('reward');
      } else {
        localStorage.setItem(`device_scan_${shopCode}`, Date.now().toString());
        setStampCount(data.stampCount || 0);
        if (data.passUrl) setPassUrl(data.passUrl);
        setPageState('success');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Something went wrong, please try again');
      setPageState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandFooter = (
    <div className="mt-8 flex items-center justify-center gap-1.5 opacity-70">
      <img src="/logo-large.svg" alt="Rekur" className="h-4 w-4" />
      <span className="on-page text-[11px] font-medium tracking-wide">
        powered by <span className="on-page font-semibold">Rekur</span>
      </span>
    </div>
  );

  if (!t || !s) {
    return (
      <div className="scan-cream flex-1 w-full max-w-sm mx-auto px-4 py-8 md:px-6 md:py-24 relative flex flex-col justify-center animate-fadeUp overflow-x-hidden">
        <div className="glass-card p-6 md:p-10 relative z-10 text-center shadow-2xl border-red-500/20 bg-stone-900/80">
          <div className="w-16 h-16 bg-red-500/10 rounded-full mx-auto flex items-center justify-center text-3xl mb-6 border border-red-500/20 text-red-500">
            ⚠️
          </div>
          <h2 className="text-2xl font-black text-stone-100 mb-4 tracking-tight">Invalid Link</h2>
          <p className="text-stone-400 font-medium leading-relaxed">
            This scanner link is missing the secure timestamp. Please scan the digital QR code at the register.
          </p>
        </div>
      </div>
    );
  }

  if (pageState === 'input') {
    return (
      <div className="scan-cream flex-1 w-full max-w-sm mx-auto px-4 py-8 md:px-6 md:py-24 relative flex flex-col justify-center animate-fadeUp overflow-x-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(245,158,11,0.12)_0%,transparent_60%)] rounded-full pointer-events-none" />
        
        <div className="glass-card p-6 md:p-10 relative z-10 mx-auto w-full shadow-2xl">
          <div className="text-center mb-8">
            {shopData ? (
              <>
                {shopData.logoUrl ? (
                  <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden border-2 border-stone-800 shadow-lg bg-white">
                    <img src={shopData.logoUrl} alt={shopData.name} className="w-full h-full object-contain p-1" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mx-auto flex items-center justify-center text-4xl mb-6 shadow-inner border border-stone-800">
                    🏪
                  </div>
                )}
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400 mb-2 tracking-tight">
                  {shopData.name}
                </h1>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-6 shadow-inner border border-stone-800">
                  📱
                </div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400 mb-2 tracking-tight">Scan to Collect</h1>
              </>
            )}
            <p className="text-stone-400 text-sm font-medium">Enter your phone number</p>
          </div>

          <div className="space-y-5">
            <div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="01012345678"
                maxLength={11}
                className={`w-full px-5 py-4 backdrop-blur-sm border rounded-xl text-center text-xl font-mono tracking-widest text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 transition shadow-inner ${
                  phoneError
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-white/10 focus:ring-amber-500/50 focus:border-amber-500/50'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && phoneNumber.length === 11) handlePhoneSubmit();
                }}
              />
              {phoneError && (
                <p className="text-red-400 text-sm mt-3 text-center font-medium bg-red-400/10 py-1.5 rounded-lg border border-red-400/20">{phoneError}</p>
              )}
            </div>

            <button
              onClick={handlePhoneSubmit}
              disabled={phoneNumber.length !== 11}
              className="w-full btn-amber py-4 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
            >
              Continue
            </button>
          </div>
        </div>
        {brandFooter}
      </div>
    );
  }

  if (pageState === 'confirm') {
    return (
      <div className="scan-cream flex-1 w-full max-w-sm mx-auto px-4 py-8 md:px-6 md:py-24 relative flex flex-col justify-center animate-fadeUp overflow-x-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(245,158,11,0.12)_0%,transparent_60%)] rounded-full pointer-events-none" />
        
        <div className="glass-card p-6 md:p-10 relative z-10 text-center shadow-2xl">
          {shopData?.logoUrl ? (
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 border-stone-800 shadow-lg bg-white">
              <img src={shopData.logoUrl} alt={shopData.name} className="w-full h-full object-contain p-0.5" />
            </div>
          ) : (
            shopData?.name && <h2 className="text-xl text-amber-500 font-bold mb-4">{shopData.name}</h2>
          )}
          <h2 className="text-2xl font-black text-stone-100 mb-6 tracking-tight">Confirm Number</h2>
          <div className="bg-stone-950 rounded-2xl p-6 mb-8 border border-white/5 shadow-inner">
            <p className="text-3xl font-mono tracking-widest font-bold text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
              {formatPhoneNumber(phoneNumber)}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full btn-amber py-4 rounded-xl text-lg shadow-lg shadow-amber-500/20 disabled:animate-pulse disabled:opacity-80"
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </button>
            <button
              onClick={handleEdit}
              disabled={isSubmitting}
              className="w-full bg-stone-900 border border-white/10 hover:bg-stone-800 text-stone-300 font-semibold py-4 rounded-xl transition hover:border-amber-500/30"
            >
              Edit Number
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'loading') {
    return <LoadingSpinner message="Adding your stamp..." />;
  }

  if (pageState === 'success') {
    return (
      <div className="scan-cream flex-1 w-full max-w-sm mx-auto px-4 py-8 md:px-6 md:py-24 relative flex flex-col justify-center animate-fadeUp overflow-x-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_60%)] rounded-full pointer-events-none" />
        
        <div className="relative z-10 text-center">
          <div className="mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] border border-stone-800 animate-fadeUp">
              🎉
            </div>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400 tracking-tight">Stamp Added!</h2>
          </div>

          <div className="glass-card p-6 md:p-8 mb-10 overflow-hidden relative">
            <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-amber-500/5 to-transparent" />
            
            <div className="grid grid-cols-5 gap-3 mb-6 relative z-10">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-xl overflow-hidden flex items-center justify-center text-lg animate-fadeUp transition-all duration-500 shadow-inner ${
                    i < stampCount
                      ? 'bg-white border-b-4 border-amber-700'
                      : 'bg-stone-900/80 border border-white/5 text-stone-600'
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {i < stampCount ? (
                    shopData?.logoUrl ? (
                      <img src={shopData.logoUrl} alt="✓" className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <span className="font-black text-amber-600">✓</span>
                    )
                  ) : (
                    <span className="font-black">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>
            
            <div className="relative z-10 mt-6 pt-6 border-t border-white/5">
              <span className="text-stone-400 font-bold uppercase tracking-widest text-xs mb-1 block">Progress</span>
              <p className="text-4xl font-black text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                {stampCount}<span className="text-2xl text-stone-600">/10</span>
              </p>
            </div>
          </div>

          {passUrl && (
            <a
              href={passUrl}
              className="mt-2 flex items-center justify-center gap-3 w-full bg-black text-white font-bold py-4 rounded-xl border border-white/20 hover:bg-stone-900 transition shadow-lg"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M17.045 13.86c-.028-2.947 2.408-4.372 2.518-4.44-1.376-2.01-3.513-2.285-4.27-2.313-1.815-.184-3.55 1.073-4.472 1.073-.922 0-2.343-1.047-3.852-1.018-1.973.03-3.8 1.148-4.822 2.908-2.058 3.568-.528 8.848 1.474 11.741.98 1.416 2.148 3.004 3.682 2.947 1.48-.058 2.036-.95 3.823-.95 1.787 0 2.29.95 3.842.921 1.593-.028 2.602-1.44 3.573-2.862 1.132-1.633 1.594-3.22 1.622-3.302-.035-.015-3.105-1.19-3.134-4.706zM14.23 5.18c.812-.986 1.36-2.353 1.21-3.718-1.17.047-2.587.78-3.43 1.763-.755.867-1.415 2.262-1.237 3.594 1.306.101 2.64-.663 3.457-1.64z"/>
              </svg>
              Add to Apple Wallet
            </a>
          )}

          {brandFooter}
        </div>
      </div>
    );
  }

  if (pageState === 'reward') {
    const remainingMs = rewardExpiresAt ? Math.max(0, rewardExpiresAt.getTime() - now) : 0;
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    const countdown = `${mins}:${secs.toString().padStart(2, '0')}`;
    const expired = remainingMs <= 0;

    return (
      <div className="scan-cream flex-1 w-full px-4 py-8 md:px-6 md:py-16 relative flex flex-col items-center justify-center overflow-hidden">
        {/* Soft amber backdrop — single subtle radial, no layered glows */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_45%_at_50%_35%,rgba(251,191,36,0.28),transparent_70%)]" />

        <div className="w-full max-w-sm">
          <div className="relative rounded-3xl border border-amber-300/40 shadow-[0_30px_80px_-30px_rgba(120,75,20,0.35)] p-8 text-center" style={{ background: 'var(--card-bg, #fffaf2)' }}>
            {/* Status pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100/70 border border-green-300/60 text-green-800 text-xs font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600" />
              </span>
              Reward ready
            </div>

            {/* Coffee illustration */}
            <div className="mt-6 mb-5 flex justify-center" aria-hidden="true">
              <div className="relative">
                <div className="absolute inset-0 -m-3 rounded-full bg-amber-300/30 blur-xl" />
                <svg viewBox="0 0 64 64" className="relative w-24 h-24 text-stone-900" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {/* steam */}
                  <path d="M22 8c0 4-4 4-4 8s4 4 4 8" stroke="rgba(60,40,22,0.35)" />
                  <path d="M32 8c0 4-4 4-4 8s4 4 4 8" stroke="rgba(60,40,22,0.35)" />
                  <path d="M42 8c0 4-4 4-4 8s4 4 4 8" stroke="rgba(60,40,22,0.35)" />
                  {/* cup */}
                  <path d="M10 28h36v12a12 12 0 0 1-12 12H22a12 12 0 0 1-12-12V28Z" />
                  <path d="M46 32h4a6 6 0 0 1 0 12h-4" />
                  {/* saucer */}
                  <path d="M8 56h40" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
              Free coffee
            </h1>
            <p className="mt-1.5 text-sm text-stone-600">
              You've reached 10 stamps.
            </p>

            <div className="mt-6 rounded-xl bg-amber-100/60 border border-amber-300/50 px-4 py-3.5">
              <p className="text-stone-900 font-medium">Show this screen to the cashier</p>
              <p className="mt-1 text-xs text-stone-600">Keep this page open until you collect.</p>
            </div>

            {/* Countdown */}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-stone-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
              </svg>
              {expired ? (
                <span>Reward has expired</span>
              ) : (
                <span>Expires in <span className="font-mono tabular-nums text-stone-700 font-medium">{countdown}</span></span>
              )}
            </div>
          </div>

          {brandFooter}
        </div>
      </div>
    );
  }

  if (pageState === 'cooldown') {
    return (
      <div className="scan-cream flex-1 w-full max-w-sm mx-auto px-4 py-8 md:px-6 md:py-24 relative flex flex-col justify-center overflow-x-hidden">
        <div className="rounded-3xl border shadow-[0_30px_60px_-30px_rgba(120,75,20,0.25)] p-8 text-center" style={{ background: 'var(--card-bg, #fffaf2)', borderColor: 'var(--card-border, rgba(80,52,28,0.1))' }}>
          <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-amber-100/70 border border-amber-300/40 flex items-center justify-center text-amber-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Please wait a moment</h2>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            You just collected a stamp. Try again in a few minutes.
          </p>
          <button
            onClick={() => {
              setPhoneNumber('');
              setPageState('input');
            }}
            className="mt-6 w-full inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-stone-900 transition"
          >
            Try again
          </button>
          {brandFooter}
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return <ErrorDisplay error={error} onRetry={() => setPageState('input')} />;
  }

  return null;
}

export default function ScanPage({ params }: ScanPageProps) {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading Secure Scanner..." />}>
      <ScanLogic shopCode={params.shopCode} />
    </Suspense>
  );
}
