'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import Link from 'next/link';
import { ErrorDisplay } from '@/app/components/ErrorDisplay';

type PageState = 'input' | 'display' | 'error' | 'loading';

interface SetupResponse {
  success: boolean;
  error?: string;
  shopId?: string;
  qrCode?: string;
  shopName?: string;
}

interface SavedShop {
  id: string;
  name: string;
  createdAt: string;
}

export default function SetupPage() {
  const [pageState, setPageState] = useState<PageState>('input');
  const [shopName, setShopName] = useState('');
  const [shopNameError, setShopNameError] = useState('');
  const [shopId, setShopId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCreateShop = async () => {
    setShopNameError('');

    if (!shopName.trim()) {
      setShopNameError('Shop name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName }),
      });

      const data: SetupResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create shop');
        setPageState('error');
        return;
      }

      // Save to localStorage
      const saved = localStorage.getItem('brew_shops');
      const shops: SavedShop[] = saved ? JSON.parse(saved) : [];
      shops.push({
        id: data.shopId!,
        name: shopName.trim(),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('brew_shops', JSON.stringify(shops));

      setShopId(data.shopId!);
      setQrCode(data.qrCode!);
      setDisplayName(shopName.trim());
      setPageState('display');
    } catch (err) {
      console.error('Error creating shop:', err);
      setError('Something went wrong, please try again');
      setPageState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrRef.current) return;

    try {
      const dataUrl = await htmlToImage.toPng(qrRef.current);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${displayName}-qr-code.png`;
      link.click();
    } catch (err) {
      console.error('Error downloading QR code:', err);
      alert('Failed to download QR code');
    }
  };

  const handleGoToAdmin = () => {
    window.location.href = `/admin/${shopId}`;
  };

  if (pageState === 'input') {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Back Link */}
          <Link href="/" className="text-zinc-400 hover:text-amber-400 text-sm mb-8 inline-block">
            ← Back
          </Link>

          <div className="text-center mb-8 animate-fadeUp">
            <div className="text-5xl mb-3">☕</div>
            <h1 className="text-4xl font-bold text-zinc-100 mb-2">Create Your Shop</h1>
            <p className="text-zinc-400">Get your unique QR code to start collecting stamps</p>
          </div>

          <div className="card-dark p-8 space-y-4 animate-fadeUp stagger-delay-1">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Shop Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => {
                  setShopName(e.target.value);
                  setShopNameError('');
                }}
                placeholder="Downtown Coffee"
                maxLength={50}
                className={`w-full px-4 py-3 bg-zinc-800 border rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 transition ${
                  shopNameError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-zinc-700 focus:ring-amber-500'
                }`}
              />
              {shopNameError && (
                <p className="text-red-400 text-sm mt-2">{shopNameError}</p>
              )}
            </div>

            <button
              onClick={handleCreateShop}
              disabled={!shopName.trim() || isSubmitting}
              className="w-full btn-amber py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Shop...' : 'Create Shop'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">☕</div>
          <p className="text-zinc-400">Creating your shop...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return <ErrorDisplay error={error} onRetry={() => setPageState('input')} />;
  }

  if (pageState === 'display') {
    const scanUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${qrCode}`;

    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8 animate-fadeUp">
            <div className="text-5xl mb-3">✨</div>
            <h1 className="text-4xl font-bold text-zinc-100 mb-2">Shop Created!</h1>
            <p className="text-zinc-400">{displayName}</p>
          </div>

          {/* QR Code Section */}
          <div className="card-dark p-8 mb-6 animate-fadeUp stagger-delay-1">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-zinc-100 mb-6">
                Customer Scan Code
              </h3>
              <div
                ref={qrRef}
                className="bg-white p-4 rounded-lg inline-block border border-zinc-700"
              >
                <QRCodeSVG
                  value={scanUrl}
                  size={300}
                  level="H"
                  includeMargin
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={handleDownloadQR}
                className="w-full btn-amber py-3 rounded-lg font-medium"
              >
                Download QR Code
              </button>
              <a
                href={`/print-qr/${shopId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border border-zinc-700 text-zinc-300 font-medium py-3 rounded-lg transition hover:border-amber-500/50 hover:text-amber-400 flex items-center justify-center"
              >
                View Printable QR Code
              </a>
            </div>
          </div>

          {/* Admin Access Section */}
          <div className="card-dark p-6 mb-4 animate-fadeUp stagger-delay-2">
            <h3 className="text-lg font-semibold text-zinc-100 mb-3">Admin Dashboard</h3>
            <p className="text-sm text-zinc-400 mb-4">
              View customers and manage stamps
            </p>
            <button
              onClick={handleGoToAdmin}
              className="w-full btn-amber py-3 rounded-lg font-medium"
            >
              Go to Dashboard
            </button>
          </div>

          {/* My Shops Link */}
          <Link
            href="/my-shops"
            className="w-full border border-zinc-700 text-zinc-300 font-medium py-3 rounded-lg transition hover:border-amber-500/50 hover:text-amber-400 flex items-center justify-center mb-4 animate-fadeUp stagger-delay-3"
          >
            View All My Shops →
          </Link>

          {/* Info Section */}
          <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/30 text-sm text-zinc-300 text-center animate-fadeUp stagger-delay-4">
            Save your admin URL: <code className="bg-zinc-900 px-2 py-1 rounded font-mono text-xs text-amber-400 mt-2 block">/admin/{shopId}</code>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
