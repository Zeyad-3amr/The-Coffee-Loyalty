'use client';

import { useEffect, useRef, useState } from 'react';

interface CameraScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let reader: any;
    let stream: MediaStream;

    async function start() {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        reader = new BrowserQRCodeReader();

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          reader.decodeFromVideoElement(videoRef.current, (result: any, err: any) => {
            if (result && scanning) {
              setScanning(false);
              stopStream(stream);
              onScan(result.getText());
            }
          });
        }
      } catch (e: any) {
        setError('Camera access denied. Please allow camera and try again.');
      }
    }

    function stopStream(s: MediaStream) {
      s?.getTracks().forEach((t) => t.stop());
    }

    start();

    return () => {
      if (stream) stopStream(stream);
      reader?.reset?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="font-bold text-stone-100">Scan Customer Card</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 transition text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="relative bg-black aspect-square">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {!error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-amber-500 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
            </div>
          )}
        </div>

        <div className="px-5 py-4 text-center">
          {error ? (
            <p className="text-red-400 text-sm font-medium">{error}</p>
          ) : (
            <p className="text-stone-400 text-sm">
              Point camera at the QR code on the customer's Apple Wallet card
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
