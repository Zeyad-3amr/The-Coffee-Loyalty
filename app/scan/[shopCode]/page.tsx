'use client';

import { useState, useEffect } from 'react';
import { validateEgyptPhoneNumber, formatPhoneNumber, isRewardExpired } from '@/app/lib/utils';
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
  message?: string;
}

export default function ScanPage({ params }: ScanPageProps) {
  const { shopCode } = params;
  const [pageState, setPageState] = useState<PageState>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [stampCount, setStampCount] = useState(0);
  const [rewardActive, setRewardActive] = useState(false);
  const [rewardExpiresAt, setRewardExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shopData, setShopData] = useState<{name: string, logoUrl: string|null} | null>(null);

  useEffect(() => {
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
        body: JSON.stringify({ phoneNumber, shopCode }),
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
        setRewardActive(true);
        setRewardExpiresAt(new Date(data.rewardExpiresAt!));
        setPageState('reward');
      } else {
        setStampCount(data.stampCount || 0);
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

  if (pageState === 'input') {
    return (
      <div className="flex-1 w-full max-w-sm mx-auto px-4 py-8 md:px-6 md:py-24 relative flex flex-col justify-center animate-fadeUp">
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
                className={`w-full px-5 py-4 bg-stone-950/80 backdrop-blur-sm border rounded-xl text-center text-xl font-mono tracking-widest text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 transition shadow-inner ${
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
      </div>
    );
  }

  if (pageState === 'confirm') {
    return (
      <div className="flex-1 w-full max-w-sm mx-auto px-4 py-8 md:px-6 md:py-24 relative flex flex-col justify-center animate-fadeUp">
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
      <div className="flex-1 w-full max-w-sm mx-auto px-4 py-8 md:px-6 md:py-24 relative flex flex-col justify-center animate-fadeUp">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_60%)] rounded-full pointer-events-none" />
        
        <div className="relative z-10 text-center">
          <div className="mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] border border-stone-800">
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
                  className={`aspect-square rounded-xl font-black flex items-center justify-center text-lg animate-fadeUp transition-all duration-500 shadow-inner ${
                    i < stampCount
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-stone-900 border-b-4 border-amber-700'
                      : 'bg-stone-900/80 border border-white/5 text-stone-600'
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {i < stampCount ? '✓' : i + 1}
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

          <button
            onClick={() => {
              setPhoneNumber('');
              setStampCount(0);
              setPageState('input');
            }}
            className="w-full btn-amber py-4 rounded-xl text-lg shadow-lg"
          >
            Scan Another
          </button>
        </div>
      </div>
    );
  }

  if (pageState === 'reward') {
    return (
      <div className="flex-1 w-full max-w-sm mx-auto px-4 py-8 md:px-6 md:py-20 relative flex flex-col justify-center overflow-hidden">
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-scale {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes neon-glow {
            0%, 100% { text-shadow: 0 0 10px rgba(251, 146, 60, 0.5), 0 0 20px rgba(251, 146, 60, 0.3); }
            50% { text-shadow: 0 0 20px rgba(251, 146, 60, 0.8), 0 0 40px rgba(251, 146, 60, 0.5); }
          }
        `}</style>
        
        {/* Wild background glows for reward state */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-900/40 via-stone-950 to-orange-900/30 -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(245,158,11,0.20)_0%,transparent_60%)] rounded-full pointer-events-none -z-10" />

        <div className="relative text-center w-full z-10 animate-fadeUp">
          <div className="absolute -top-16 -left-6 text-6xl opacity-30" style={{animation: 'float 4s ease-in-out infinite'}}>✨</div>
          <div className="absolute -bottom-16 -right-6 text-6xl opacity-30" style={{ animation: 'float 3s ease-in-out infinite 1s' }}>🎉</div>

          <div className="glass-card bg-stone-900/80 p-6 md:p-10 shadow-2xl border-2 border-amber-500/50 glow-amber relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-6xl" style={{ animation: 'spin 6s linear infinite' }}>🌟</div>

            <div className="mt-8">
              <h1 className="text-4xl font-black text-amber-400 mb-3" style={{ animation: 'neon-glow 2s ease-in-out infinite' }}>
                Free Coffee!
              </h1>
              <p className="text-stone-300 font-medium mb-8">You've reached 10 stamps!</p>

              <div className="mb-10 flex justify-center">
                <div className="text-9xl relative" style={{ animation: 'pulse-scale 2s ease-in-out infinite' }}>
                  ☕
                </div>
              </div>

              <div className="bg-amber-500/20 border border-amber-500/40 rounded-2xl p-6 mb-8 shadow-inner">
                <p className="text-sm font-bold uppercase tracking-wider text-stone-300 mb-2">Instructions</p>
                <p className="text-2xl font-black text-amber-500">Present Your Phone</p>
                <p className="text-sm text-stone-400 mt-2">Show this screen to the cashier</p>
              </div>

              <p className="text-xs text-amber-500/70 font-medium uppercase tracking-widest px-4">
                Reward expires in a few minutes. Don't close this screen!
              </p>
            </div>

            <div className="mt-8 flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                  style={{
                    animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'cooldown') {
    return (
      <div className="flex-1 w-full max-w-sm mx-auto px-4 py-8 md:px-6 md:py-24 relative flex flex-col justify-center animate-fadeUp">
        <div className="glass-card p-6 md:p-10 text-center relative z-10 mx-auto w-full shadow-2xl">
          <div className="w-20 h-20 bg-stone-800 rounded-full mx-auto flex items-center justify-center text-4xl mb-6 shadow-inner border border-white/5">
            ⏱️
          </div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400 mb-4 tracking-tight">Please Wait</h2>
          <p className="text-stone-400 mb-10 leading-relaxed font-medium">
            You already scanned recently. Please wait a few minutes before scanning again to collect another stamp.
          </p>
          <button
            onClick={() => {
              setPhoneNumber('');
              setPageState('input');
            }}
            className="w-full btn-amber py-4 rounded-xl text-lg shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return <ErrorDisplay error={error} onRetry={() => setPageState('input')} />;
  }

  return null;
}
