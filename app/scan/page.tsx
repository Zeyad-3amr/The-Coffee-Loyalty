import Link from 'next/link';

export default function ScanPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
      <div className="w-full max-w-md text-center animate-fadeUp">
        <div className="text-6xl mb-4">📱</div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-4">Scan QR Code</h1>
        <p className="text-zinc-400 mb-6">
          Open your phone's camera or QR code scanner and scan the QR code at your coffee shop counter.
        </p>
        <div className="bg-amber-500/10 border-l-4 border-amber-500/50 p-4 rounded mb-6">
          <p className="text-sm text-amber-400">
            You'll be automatically directed to the loyalty stamp page once you scan!
          </p>
        </div>
        <Link
          href="/"
          className="inline-block btn-amber py-3 px-8 rounded-lg font-medium hover:shadow-lg hover:shadow-amber-500/30 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
