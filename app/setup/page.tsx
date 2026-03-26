'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import { ErrorDisplay } from '@/app/components/ErrorDisplay';

type PageState = 'input' | 'display' | 'error' | 'loading';

interface SetupResponse {
  success: boolean;
  error?: string;
  shopId?: string;
  qrCode?: string;
  shopName?: string;
}

export default function SetupPage() {
  const [pageState, setPageState] = useState<PageState>('input');
  const [shopName, setShopName] = useState('');
  const [shopNameError, setShopNameError] = useState('');
  const [shopId, setShopId] = useState('');
  const [qrCode, setQrCode] = useState('');
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

      setShopId(data.shopId!);
      setQrCode(data.qrCode!);
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
      link.download = `${shopName}-qr-code.png`;
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-2">☕</h1>
            <h2 className="text-2xl font-bold text-gray-900">Setup Your Coffee Shop</h2>
            <p className="text-gray-600 text-sm mt-2">Get started with the loyalty program</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => {
                  setShopName(e.target.value);
                  setShopNameError('');
                }}
                placeholder="e.g., Downtown Coffee"
                maxLength={50}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                  shopNameError
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 focus:border-orange-500'
                }`}
              />
              {shopNameError && (
                <p className="text-red-600 text-sm mt-2">{shopNameError}</p>
              )}
            </div>

            <button
              onClick={handleCreateShop}
              disabled={!shopName.trim() || isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition"
            >
              {isSubmitting ? 'Creating Shop...' : 'Create Shop & Generate QR Code'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">☕</div>
          <p className="text-gray-600">Creating your shop...</p>
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
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-2">✨</h1>
            <h2 className="text-2xl font-bold text-gray-900">Shop Created!</h2>
            <p className="text-gray-600 text-sm mt-2">{shopName}</p>
          </div>

          {/* QR Code Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Scan Code
              </h3>
              <div
                ref={qrRef}
                className="bg-white p-4 rounded-lg inline-block"
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
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition"
              >
                📥 Download QR Code as PNG
              </button>
              <a
                href={`/print-qr/${shopId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                🖨️ View Printable QR Code
              </a>
              <p className="text-xs text-gray-500 text-center">
                Print this QR code and display at your counter
              </p>
            </div>
          </div>

          {/* Admin Access Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Admin Dashboard</h3>
            <p className="text-sm text-gray-600 mb-4">
              View customers, manage stamps, and track loyalty program performance
            </p>
            <button
              onClick={handleGoToAdmin}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition"
            >
              Go to Admin Dashboard
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Save the admin dashboard URL in your bookmarks. You can come back anytime by visiting <code className="text-xs font-mono bg-amber-100 px-2 py-1 rounded">/admin/{shopId}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
