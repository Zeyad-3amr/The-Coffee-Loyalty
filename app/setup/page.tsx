'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ErrorDisplay } from '@/app/components/ErrorDisplay';
import { supabase } from '@/app/lib/supabase-client';

type PageState = 'loading' | 'input' | 'display' | 'error';

interface SetupResponse {
  success: boolean;
  error?: string;
  shopId?: string;
  qrCode?: string;
  shopName?: string;
}

export default function SetupPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [shopName, setShopName] = useState('');
  const [shopNameError, setShopNameError] = useState('');
  const [shopId, setShopId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth');
      } else {
        setPageState('input');
      }
    });
  }, [router]);

  const handleCreateShop = async () => {
    setShopNameError('');

    if (!shopName.trim()) {
      setShopNameError('Shop name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
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

  if (pageState === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-bounce drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">☕</div>
          <p className="text-stone-400 text-xl font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'input') {
    return (
      <div className="flex-1 w-full max-w-lg mx-auto px-6 py-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <Link href="/my-shops" className="group inline-flex items-center gap-2 text-stone-400 hover:text-amber-400 font-medium mb-12 transition-colors">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> My Shops
          </Link>

          <div className="text-center mb-10 animate-fadeUp">
            <div className="w-24 h-24 mx-auto mb-6">
              <img src="/logo-primary.svg" alt="Rekur" className="w-full h-full" />
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400 mb-3 tracking-tight">Create Your Shop</h1>
            <p className="text-stone-400 text-lg">Set up your premium loyalty program in seconds</p>
          </div>

          <div className="glass-card p-10 animate-fadeUp stagger-delay-1 relative overflow-visible">
            <div className="absolute -top-3 -right-3 w-20 h-20 bg-amber-500/20 blur-2xl rounded-full" />
            <div className="relative z-10">
              <label className="block text-sm font-bold text-stone-300 mb-3 ml-1 uppercase tracking-wider">
                Shop Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => { setShopName(e.target.value); setShopNameError(''); }}
                placeholder="e.g. Downtown Coffee Roasters"
                maxLength={50}
                className={`w-full px-5 py-4 bg-stone-950 border rounded-xl text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 transition shadow-inner font-medium text-lg ${
                  shopNameError ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-amber-500/50 focus:border-amber-500/50'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && shopName.trim() && !isSubmitting) handleCreateShop();
                }}
              />
              {shopNameError && (
                <p className="text-red-400 text-sm mt-3 ml-1 font-medium bg-red-400/10 inline-block px-3 py-1 rounded-lg border border-red-400/20">{shopNameError}</p>
              )}
              <button
                onClick={handleCreateShop}
                disabled={!shopName.trim() || isSubmitting}
                className="w-full btn-amber py-4 rounded-xl text-lg mt-8 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl shadow-amber-500/20"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 border-2 border-stone-950/20 border-t-stone-950 rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : 'Create Shop'}
              </button>
            </div>
          </div>
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
      <div className="flex-1 w-full max-w-lg mx-auto px-6 py-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-10 animate-fadeUp">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mx-auto flex items-center justify-center text-4xl mb-6 shadow-xl shadow-amber-500/40 border-4 border-stone-900">
              ✨
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400 mb-3 tracking-tight">Shop Created!</h1>
            <p className="text-amber-400 font-medium text-xl">{displayName}</p>
          </div>

          <div className="glass-card p-10 mb-8 animate-fadeUp stagger-delay-1 relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 to-amber-400 opacity-50" />
            <div className="text-center mb-8">
              <h3 className="text-lg font-bold text-stone-300 uppercase tracking-widest mb-8">Customer Scan Code</h3>
              <div ref={qrRef} className="bg-white p-6 rounded-3xl inline-block border-[8px] border-stone-900 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                <QRCodeSVG value={scanUrl} size={200} level="H" includeMargin={false} fgColor="#000000" bgColor="#ffffff" />
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={handleDownloadQR} className="w-full btn-amber py-4 rounded-xl text-lg shadow-lg">
                Download QR Code
              </button>
              <a
                href={`/print-qr/${shopId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-stone-900 hover:bg-stone-800 text-stone-300 font-semibold py-4 rounded-xl transition flex items-center justify-center border border-white/10 hover:border-amber-500/30"
              >
                View Printable Poster
              </a>
            </div>
          </div>

          <div className="glass-card p-8 mb-6 animate-fadeUp stagger-delay-2">
            <h3 className="text-xl font-bold text-stone-100 mb-2">Admin Dashboard</h3>
            <p className="text-stone-400 mb-6 leading-relaxed">Track customer visits, manage stamps, and monitor growth.</p>
            <Link
              href={`/admin/${shopId}`}
              className="block w-full bg-stone-100 hover:bg-white text-stone-950 font-bold py-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg text-center"
            >
              Go to Dashboard
            </Link>
          </div>

          <Link
            href="/my-shops"
            className="w-full text-stone-400 hover:text-amber-400 font-medium py-3 transition flex items-center justify-center mb-6 animate-fadeUp stagger-delay-3 group"
          >
            View All My Shops <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
