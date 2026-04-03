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
    <div className="flex-1 flex flex-col w-full relative min-h-screen items-center justify-center p-4">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Main Scanner Card */}
      <div className="glass-card max-w-sm w-full p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-2xl relative z-10 animate-fadeUp border-amber-500/20 bg-stone-950/80 backdrop-blur-xl">
        
        {/* Title Segment */}
        <div className="w-full text-center mb-4 pb-4 border-b border-white/10">
          {shopData.logoUrl ? (
            <div className="mx-auto w-16 h-16 rounded-full bg-white border-2 border-stone-800 overflow-hidden flex items-center justify-center mb-4 shadow-lg">
              <img src={shopData.logoUrl} alt="Shop logo" className="w-full h-full object-contain p-1" />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner border border-stone-800">
              ☕
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400 mb-1 tracking-tighter uppercase">
            {shopData.name}
          </h1>
          <p className="text-stone-400 text-xs tracking-widest uppercase font-black drop-shadow-md">
            Premium Loyalty Rewards
          </p>
        </div>

        {/* QR Code Segment */}
        <div className="bg-white p-3 rounded-[1.5rem] shadow-[0_0_30px_rgba(245,158,11,0.1)] mb-6 flex flex-col items-center justify-center border-[6px] border-stone-900">
          {scanUrl ? (
            <QRCodeSVG
              value={scanUrl}
              size={220}
              level="H"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          ) : (
            <div className="w-[220px] h-[220px] bg-stone-100 flex flex-col items-center justify-center text-stone-400 rounded-2xl">
              <span className="text-3xl mb-3 animate-spin">⏳</span>
              <span className="text-xs font-medium uppercase tracking-wider">Generating Secure Code...</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-amber-500/10 border border-amber-500/20 py-2 px-6 rounded-full mb-6 shadow-inner">
           <p className="text-lg font-black uppercase tracking-wider text-amber-500">
             Scan to Collect Stamps
           </p>
        </div>

        <div className="text-stone-300 font-medium mb-6 flex flex-col gap-2 text-sm w-full max-w-xs mx-auto bg-stone-900/60 p-4 rounded-xl border border-white/5 shadow-inner text-left tracking-wide">
           <p className="flex items-center gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-stone-800 flex items-center justify-center text-amber-500 font-bold border border-white/10 text-xs">1</span> Scan this code with your phone</p>
           <p className="flex items-center gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-stone-800 flex items-center justify-center text-amber-500 font-bold border border-white/10 text-xs">2</span> Enter your phone number</p>
           <p className="flex items-center gap-3 text-amber-400 mt-2 font-black border-t border-dashed border-white/10 pt-3"><span className="text-xl">🎉</span> 10 Stamps = Free Coffee!</p>
        </div>

        {/* Footer Segment */}
        <div className="mt-2 pt-4 border-t-2 border-dashed border-stone-800 flex flex-col items-center justify-center w-full">
          <div className="flex items-center justify-center gap-2 mb-2 opacity-70 hover:opacity-100 transition">
            <img src="/logo-large.svg" alt="Rekur" className="h-5 w-5" />
            <p className="font-black tracking-widest uppercase text-stone-300 text-[10px] drop-shadow-sm">Powered by Rekur</p>
          </div>
          <div className="flex items-center gap-2 text-green-500/60 text-[8px] font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            Live Secure Screen Regenerating
          </div>
        </div>

      </div>
    </div>
  );
}
