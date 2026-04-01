'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface PrintPageProps {
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

export default function PrintQRPage({ params }: PrintPageProps) {
  const { shopId } = params;
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch shop data
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-5xl mb-6 animate-bounce drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">☕</div>
          <p className="text-stone-400 text-lg font-medium animate-pulse">Loading poster...</p>
        </div>
      </div>
    );
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

  const scanUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${shopData.qrCode}`;

  return (
    <div className="flex-1 flex flex-col w-full relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none print:hidden" />

      {/* Non-print content: Header and buttons */}
      <div className="print:hidden border-b border-white/5 p-6 bg-stone-950/50 backdrop-blur-sm z-10 w-full sticky top-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400 tracking-tight">{shopData.name}</h1>
            <p className="text-amber-500 text-sm font-semibold tracking-wide uppercase mt-1">Print QR Poster</p>
          </div>
          <button
            onClick={handlePrint}
            className="btn-amber shadow-lg shadow-amber-500/20 py-3 px-8 rounded-xl font-bold whitespace-nowrap w-full sm:w-auto"
          >
            Print Poster
          </button>
        </div>
      </div>

      {/* Printable content - stays white for printing, styled nicer to be premium on screen too */}
      <div className="w-full flex-1 flex flex-col items-center justify-center p-8 print:p-0 print:bg-white relative z-10">
        
        <div className="mb-8 text-center print:hidden max-w-md animate-fadeUp">
          <p className="text-stone-400 text-lg">Below is a preview of the print layout. Best printed on <span className="text-stone-200 font-bold">A4 size paper</span> in portrait mode.</p>
        </div>

        <div
          ref={qrRef}
          className="bg-white print:bg-white p-10 print:p-0 flex flex-col items-center justify-center shadow-2xl print:shadow-none border border-stone-800 print:border-none rounded-xl print:rounded-none w-full animate-fadeUp stagger-delay-1 mx-auto"
          style={{ width: '100%', maxWidth: '170mm' }}
        >
          {/* Title Segment */}
          <div className="w-full text-center mb-10 border-b-4 border-black pb-8">
            {shopData.logoUrl ? (
              <div className="mx-auto w-24 h-24 rounded-full bg-white border-4 border-black overflow-hidden flex items-center justify-center mb-6">
                <img src={shopData.logoUrl} alt="Shop logo" className="w-full h-full object-contain p-1" />
              </div>
            ) : (
              <div className="mx-auto w-24 h-24 bg-black rounded-full flex items-center justify-center text-white text-5xl mb-6 print:bg-black">
                ☕
              </div>
            )}
            <h1 className="text-5xl font-black text-black print:text-black mb-3 tracking-tighter uppercase">
              {shopData.name}
            </h1>
            <p className="text-2xl text-gray-800 print:text-gray-800 tracking-widest uppercase font-semibold">
              Premium Loyalty Rewards
            </p>
          </div>

          {/* QR Code Segment */}
          <div className="bg-white print:bg-white p-4 border-[6px] border-black rounded-2xl mb-8 flex items-center justify-center">
            <QRCodeSVG
              value={scanUrl}
              size={260}
              level="H"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>

          {/* Instructions Segment */}
          <div className="text-center max-w-md mx-auto w-full">
            <div className="bg-black text-white py-3 px-8 rounded-full mb-8 inline-block shadow-lg">
              <p className="text-2xl font-black uppercase tracking-wider">
                Scan to Collect Stamps
              </p>
            </div>
            
            <div className="space-y-5 text-xl text-gray-900 print:text-gray-900 font-medium text-left bg-gray-50 border-2 border-gray-200 p-8 rounded-2xl w-full mx-auto">
              <p className="flex items-center gap-4">
                <span className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono">1</span> 
                Scan this code with your phone
              </p>
              <p className="flex items-center gap-4">
                <span className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono">2</span> 
                Enter your phone number
              </p>
              <p className="flex items-center gap-4 text-2xl font-black mt-6 border-t border-gray-300 pt-6 border-dashed">
                <span className="text-4xl">☕</span> 
                10 stamps = <span className="underline decoration-4 decoration-black">Free Coffee</span>!
              </p>
            </div>
          </div>

          {/* Footer Segment */}
          <div className="mt-16 pt-8 text-center text-gray-500 print:text-gray-500 w-full border-t-2 border-dashed border-gray-300">
            <p className="font-bold tracking-widest uppercase mb-1">Powered by Brew</p>
            <p className="text-sm">No app required • Instant secure stamps</p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hide global navbar when printing */
          nav {
            display: none !important;
          }
          
          main {
            padding: 0 !important;
            margin: 0 !important;
          }

          html, body {
            height: 100%;
            width: 100%;
          }

          div {
            page-break-inside: avoid;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
