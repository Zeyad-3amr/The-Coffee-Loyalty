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

  // Check on mount if reward has expired
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
        // Store reward in session storage
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Scan to Collect</h1>
            <p className="text-gray-600">Enter your phone number</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="01012345678"
                maxLength={11}
                className={`w-full px-4 py-3 border rounded-lg text-center text-lg font-mono focus:outline-none focus:ring-2 ${
                  phoneError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-amber-600'
                }`}
              />
              {phoneError && (
                <p className="text-red-600 text-sm mt-2">{phoneError}</p>
              )}
            </div>

            <button
              onClick={handlePhoneSubmit}
              disabled={phoneNumber.length !== 11}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition"
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Your Number</h2>
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <p className="text-4xl font-bold text-amber-600">
              {formatPhoneNumber(phoneNumber)}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition"
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </button>
            <button
              onClick={handleEdit}
              disabled={isSubmitting}
              className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 rounded-lg transition"
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">☕</div>
          <p className="text-gray-600">Processing...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Stamp Added!</h2>
          </div>

          {/* Stamp card visualization */}
          <div className="bg-gray-50 rounded-lg p-8 mb-8 border border-gray-200">
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg font-bold flex items-center justify-center text-sm ${
                    i < stampCount
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i < stampCount ? '✓' : i + 1}
                </div>
              ))}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stampCount}/10
            </p>
          </div>

          <button
            onClick={() => {
              setPhoneNumber('');
              setStampCount(0);
              setPageState('input');
            }}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-lg transition"
          >
            Scan Another
          </button>
        </div>
      </div>
    );
  }

  if (pageState === 'reward') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-300 via-orange-300 to-red-400 px-4 overflow-hidden">
        {/* Animated background elements */}
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
          .float-animation {
            animation: float 3s ease-in-out infinite;
          }
          .spin-animation {
            animation: spin 4s linear infinite;
          }
          .pulse-animation {
            animation: pulse-scale 2s ease-in-out infinite;
          }
        `}</style>

        <div className="relative w-full max-w-sm">
          {/* Decorative elements */}
          <div className="absolute -top-20 -left-10 text-6xl opacity-30 float-animation">☕</div>
          <div className="absolute -bottom-20 -right-10 text-6xl opacity-30 float-animation" style={{ animationDelay: '1s' }}>☕</div>

          {/* Main reward card */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center relative z-10">
            {/* Spinning decoration */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl spin-animation">🎉</div>

            {/* Main content */}
            <div className="mt-4">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-2">
                Free Coffee!
              </h1>
              <p className="text-gray-600 mb-6">You've earned a free coffee!</p>

              {/* Animated coffee cup */}
              <div className="mb-6 flex justify-center">
                <div className="text-8xl pulse-animation">☕</div>
              </div>

              <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Show this screen to the cashier</p>
                <p className="text-2xl font-bold text-orange-600">Present Your Phone</p>
              </div>

              <p className="text-xs text-gray-500">
                Reward expires in 7 minutes. Come back anytime within this window!
              </p>
            </div>

            {/* Continuous animation indicator */}
            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-orange-500 rounded-full"
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-4">⏱️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Wait</h2>
          <p className="text-gray-600 mb-8">
            You already scanned recently. Please wait a few minutes before scanning again.
          </p>
          <button
            onClick={() => {
              setPhoneNumber('');
              setPageState('input');
            }}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-lg transition"
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
