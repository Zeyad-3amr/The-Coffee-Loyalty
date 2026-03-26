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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">☕</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !shopData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Shop not found'}</p>
          <a
            href="/"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const scanUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${shopData.qrCode}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Non-print content: Header and buttons */}
      <div className="print:hidden bg-gray-50 border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shopData.name}</h1>
            <p className="text-gray-600 text-sm">QR Code for Customer Scanning</p>
          </div>
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="w-full h-screen flex items-center justify-center p-4 print:p-0">
        <div
          ref={qrRef}
          className="bg-white p-12 print:p-0 flex flex-col items-center justify-center max-w-2xl"
        >
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
            {shopData.name}
          </h1>
          <p className="text-xl text-gray-600 mb-8 text-center">
            Loyalty Program
          </p>

          {/* QR Code */}
          <div className="bg-white p-8 border-4 border-gray-300 rounded-lg shadow-lg mb-8">
            <QRCodeSVG
              value={scanUrl}
              size={400}
              level="H"
              includeMargin
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>

          {/* Instructions */}
          <div className="text-center max-w-md">
            <p className="text-lg font-semibold text-gray-900 mb-4">
              ☕ Scan to Collect Stamps
            </p>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>1.</strong> Customer scans this QR code with their phone
              </p>
              <p>
                <strong>2.</strong> Enter their phone number
              </p>
              <p>
                <strong>3.</strong> Receive a digital stamp
              </p>
              <p>
                <strong>4.</strong> Collect 10 stamps to earn a free coffee!
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-300 text-center text-sm text-gray-600 w-full">
            <p>No app download needed • Instant digital stamps</p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }

          html,
          body {
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
