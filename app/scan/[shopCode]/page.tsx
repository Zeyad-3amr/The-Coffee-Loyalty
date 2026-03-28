'use client';

import { useState, useEffect } from 'react';
import { validateEgyptPhoneNumber, formatPhoneNumber, isRewardExpired } from '@/app/lib/utils';
import { ErrorDisplay } from '@/app/components/ErrorDisplay';

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4 animate-fadeUp">
        <div className="w-full max-w-sm card-dark p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-zinc-100 mb-2">Scan to Collect</h1>
            <p className="text-zinc-400">Enter your phone number</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="01012345678"
                maxLength={11}
                className={`w-full px-4 py-3 bg-zinc-800 border rounded-lg text-center text-lg font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 transition ${
                  phoneError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-zinc-700 focus:ring-amber-500'
                }`}
              />
              {phoneError && (
                <p className="text-red-400 text-sm mt-2">{phoneError}</p>
              )}
            </div>

            <button
              onClick={handlePhoneSubmit}
              disabled={phoneNumber.length !== 11}
              className="w-full btn-amber py-3 rounded-lg font-medium disabled:opacity-50"
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4 animate-fadeUp">
        <div className="w-full max-w-sm card-dark p-8 text-center">
          <h2 className="text-2xl font-bold text-zinc-100 mb-6">Confirm Your Number</h2>
          <div className="bg-zinc-800 rounded-lg p-6 mb-6 border border-zinc-700">
            <p className="text-4xl font-bold text-amber-400">
              {formatPhoneNumber(phoneNumber)}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full btn-amber py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </button>
            <button
              onClick={handleEdit}
              disabled={isSubmitting}
              className="w-full border border-zinc-700 hover:border-amber-500/50 text-zinc-300 hover:text-amber-400 font-medium py-3 rounded-lg transition"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center animate-fadeUp">
          <div className="text-4xl mb-4 animate-bounce">☕</div>
          <p className="text-zinc-400">Processing...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4 animate-fadeUp">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-zinc-100">Stamp Added!</h2>
          </div>

          <div className="card-dark p-8 mb-8 rounded-lg">
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg font-bold flex items-center justify-center text-sm animate-fadeUp ${
                    i < stampCount
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {i < stampCount ? '✓' : i + 1}
                </div>
              ))}
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {stampCount}/10
            </p>
          </div>

          <button
            onClick={() => {
              setPhoneNumber('');
              setStampCount(0);
              setPageState('input');
            }}
            className="w-full btn-amber py-3 rounded-lg font-medium"
          >
            Scan Another
          </button>
        </div>
      </div>
    );
  }

  if (pageState === 'reward') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 via-amber-900 to-orange-900 px-4 overflow-hidden">
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
          .float-animation {
            animation: float 3s ease-in-out infinite;
            opacity: 0.2;
          }
          .spin-animation {
            animation: spin 4s linear infinite;
          }
          .pulse-animation {
            animation: pulse-scale 2s ease-in-out infinite;
          }
          .neon-glow-text {
            animation: neon-glow 2s ease-in-out infinite;
          }
        `}</style>

        <div className="relative w-full max-w-sm">
          <div className="absolute -top-20 -left-10 text-6xl float-animation">☕</div>
          <div className="absolute -bottom-20 -right-10 text-6xl float-animation" style={{ animationDelay: '1s' }}>☕</div>

          <div className="bg-zinc-900 rounded-3xl p-8 shadow-2xl text-center relative z-10 border border-amber-500/30 glow-amber">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl spin-animation">🎉</div>

            <div className="mt-4">
              <h1 className="text-5xl font-bold text-amber-400 mb-2 neon-glow-text">
                Free Coffee!
              </h1>
              <p className="text-zinc-300 mb-6">You've earned a free coffee reward</p>

              <div className="mb-6 flex justify-center">
                <div className="text-8xl pulse-animation">☕</div>
              </div>

              <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-zinc-300 mb-2">Show this screen to the cashier</p>
                <p className="text-2xl font-bold text-amber-400">Present Your Phone</p>
              </div>

              <p className="text-xs text-zinc-400">
                Reward expires in 7 minutes. Come back anytime within this window!
              </p>
            </div>

            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-amber-400 rounded-full"
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4 animate-fadeUp">
        <div className="w-full max-w-sm card-dark p-8 text-center">
          <div className="text-6xl mb-4">⏱️</div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">Please Wait</h2>
          <p className="text-zinc-400 mb-8">
            You already scanned recently. Please wait a few minutes before scanning again.
          </p>
          <button
            onClick={() => {
              setPhoneNumber('');
              setPageState('input');
            }}
            className="w-full btn-amber py-3 rounded-lg font-medium"
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
