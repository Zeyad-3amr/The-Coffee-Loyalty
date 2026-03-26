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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">☕</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !shopData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md text-center border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Shop not found'}</p>
          <a
            href="/"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-6 rounded-lg transition"
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
      <div className="print:hidden border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shopData.name}</h1>
            <p className="text-gray-600 text-sm">Print QR Code for Customers</p>
          </div>
          <button
            onClick={handlePrint}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-6 rounded-lg transition"
          >
            Print
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
          <h1 className="text-4xl font-bold text-gray-900 mb-1 text-center">
            {shopData.name}
          </h1>
          <p className="text-lg text-gray-600 mb-8 text-center">
            Loyalty Program
          </p>

          {/* QR Code */}
          <div className="bg-white p-8 border border-gray-300 rounded-lg mb-8">
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
              Scan to Collect Stamps
            </p>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>1.</strong> Customer scans with their phone
              </p>
              <p>
                <strong>2.</strong> Enter phone number
              </p>
              <p>
                <strong>3.</strong> Get a digital stamp
              </p>
              <p>
                <strong>4.</strong> 10 stamps = 1 free coffee
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-300 text-center text-sm text-gray-600 w-full">
            <p>No app needed • Instant stamps</p>
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
