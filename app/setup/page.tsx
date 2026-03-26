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
      <div className="min-h-screen bg-white px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Your Shop</h1>
            <p className="text-gray-600">Get your unique QR code to start collecting stamps</p>
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
                placeholder="Downtown Coffee"
                maxLength={50}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  shopNameError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-amber-600'
                }`}
              />
              {shopNameError && (
                <p className="text-red-600 text-sm mt-2">{shopNameError}</p>
              )}
            </div>

            <button
              onClick={handleCreateShop}
              disabled={!shopName.trim() || isSubmitting}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition"
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
      <div className="flex items-center justify-center min-h-screen bg-white">
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
      <div className="min-h-screen bg-white px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Shop Created!</h1>
            <p className="text-gray-600">{shopName}</p>
          </div>

          {/* QR Code Section */}
          <div className="bg-gray-50 rounded-lg p-8 mb-6 border border-gray-200">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Customer Scan Code
              </h3>
              <div
                ref={qrRef}
                className="bg-white p-4 rounded-lg inline-block border border-gray-200"
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
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-lg transition"
              >
                Download QR Code
              </button>
              <a
                href={`/print-qr/${shopId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border border-gray-300 hover:border-gray-400 text-gray-900 font-medium py-3 rounded-lg transition flex items-center justify-center"
              >
                View Printable QR Code
              </a>
            </div>
          </div>

          {/* Admin Access Section */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Dashboard</h3>
            <p className="text-sm text-gray-600 mb-4">
              View customers and manage stamps
            </p>
            <button
              onClick={handleGoToAdmin}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-lg transition"
            >
              Go to Dashboard
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-sm text-gray-700">
            Save the dashboard URL: <code className="bg-white px-2 py-1 rounded font-mono text-xs">/admin/{shopId}</code>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
