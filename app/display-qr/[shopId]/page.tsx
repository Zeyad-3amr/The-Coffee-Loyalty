'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';

interface DisplayQRPageProps {
  params: {
    shopId: string;
  };
}

interface ShopData {
  id: string;
  name: string;
  qrCode: string;
  logoUrl?: string | null;
}

export default function DisplayQRPage({ params }: DisplayQRPageProps) {
  const { shopId } = params;
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrToken, setQrToken] = useState({ t: '', s: '' });

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const response = await fetch(`/api/admin/${shopId}`);
        const data = await response.json();

        if (data.success && data.shop) {
          setShopData(data.shop);
        } else {
          setError('Shop not found');
        }
      } catch (err) {
        console.error('Error fetching shop:', err);
        setError('Failed to load shop data');
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopId]);

  useEffect(() => {
    if (shopData) {
      const fetchToken = async () => {
        try {
          const res = await fetch(`/api/admin/${shopId}/token`);
          const data = await res.json();
          if (data.success) {
            setQrToken({ t: data.t, s: data.s });
          }
        } catch (e) {
          console.error(e);
        }
      };
      
      fetchToken();
      const interval = setInterval(fetchToken, 20000);
      return () => clearInterval(interval);
    }
  }, [shopId, shopData]);

  if (loading) {
    return <LoadingSpinner message="Loading secure scanner..." />;
  }

  if (error || !shopData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="glass-card p-10 max-w-md w-full text-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <div className="w-16 h-16 bg-red-500/10 rounded-full mx-auto flex items-center justify-center text-3xl mb-6 border border-red-500/20 text-red-500">
            ⚠️
          </div>
          <h2 className="text-3xl font-bold text-stone-100 mb-4 tracking-tight">Error</h2>
          <p className="text-stone-400 mb-8 font-medium">{error || 'Shop not found'}</p>
          <a
            href="/"
            className="w-full inline-block btn-amber py-4 rounded-xl shadow-lg"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const scanUrl = qrToken.t ? `${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${shopData.qrCode}?t=${qrToken.t}&s=${qrToken.s}` : '';

  return (
    <div className="flex-1 flex flex-col w-full relative min-h-screen items-center justify-center p-6 sm:p-10">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 blur-[200px] rounded-full pointer-events-none" />

      {/* Main Scanner Card */}
      <div className="glass-card max-w-2xl w-full p-10 md:p-16 flex flex-col items-center justify-center text-center shadow-2xl relative z-10 animate-fadeUp border-amber-500/20 bg-stone-950/80 backdrop-blur-xl">
        
        {/* Title Segment */}
        <div className="w-full text-center mb-10 pb-8 border-b border-white/10">
          {shopData.logoUrl ? (
            <div className="mx-auto w-24 h-24 rounded-full bg-white border-2 border-stone-800 overflow-hidden flex items-center justify-center mb-6 shadow-xl">
              <img src={shopData.logoUrl} alt="Shop logo" className="w-full h-full object-contain p-1" />
            </div>
          ) : (
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner border border-stone-800">
              ☕
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400 mb-3 tracking-tighter uppercase">
            {shopData.name}
          </h1>
          <p className="text-stone-400 text-lg tracking-widest uppercase font-black drop-shadow-md">
            Premium Loyalty Rewards
          </p>
        </div>

        {/* QR Code Segment */}
        <div className="bg-white p-6 rounded-[2rem] shadow-[0_0_50px_rgba(245,158,11,0.15)] mb-10 flex flex-col items-center justify-center border-[8px] border-stone-900">
          {scanUrl ? (
            <QRCodeSVG
              value={scanUrl}
              size={300}
              level="H"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          ) : (
            <div className="w-[300px] h-[300px] bg-stone-100 flex flex-col items-center justify-center text-stone-400 rounded-2xl">
              <span className="text-4xl mb-4 animate-spin">⏳</span>
              <span className="font-medium uppercase tracking-wider">Generating Secure Code...</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-amber-500/10 border border-amber-500/20 py-4 px-10 rounded-full mb-10 shadow-inner">
           <p className="text-2xl font-black uppercase tracking-wider text-amber-500">
             Scan to Collect Stamps
           </p>
        </div>

        <div className="text-stone-300 font-medium mb-12 flex flex-col gap-4 text-xl w-full max-w-sm mx-auto bg-stone-900/60 p-8 rounded-2xl border border-white/5 shadow-inner text-left tracking-wide">
           <p className="flex items-center gap-4"><span className="w-10 h-10 shrink-0 rounded-full bg-stone-800 flex items-center justify-center text-amber-500 font-bold border border-white/10 text-lg">1</span> Scan this code with your phone</p>
           <p className="flex items-center gap-4"><span className="w-10 h-10 shrink-0 rounded-full bg-stone-800 flex items-center justify-center text-amber-500 font-bold border border-white/10 text-lg">2</span> Enter your phone number</p>
           <p className="flex items-center gap-4 text-amber-400 mt-4 font-black border-t border-dashed border-white/10 pt-6"><span className="text-3xl">🎉</span> 10 Stamps = Free Coffee!</p>
        </div>

        {/* Footer Segment */}
        <div className="mt-4 pt-10 border-t-2 border-dashed border-stone-800 flex flex-col items-center justify-center w-full">
          <div className="flex items-center justify-center gap-3 mb-3 opacity-70 hover:opacity-100 transition">
            <img src="/logo-large.svg" alt="Rekur" className="h-8 w-8" />
            <p className="font-black tracking-widest uppercase text-stone-300 text-sm drop-shadow-sm">Powered by Rekur</p>
          </div>
          <div className="flex items-center gap-2 text-green-500/60 text-xs font-black uppercase tracking-widest">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
            Live Secure Screen Regenerating
          </div>
        </div>

      </div>
    </div>
  );
}
