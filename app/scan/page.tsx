import Link from 'next/link';

export default function ScanPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center px-6 py-20 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md text-center animate-fadeUp relative z-10 glass-card p-10 shadow-2xl">
        <div className="w-20 h-20 bg-zinc-900 rounded-3xl mx-auto flex items-center justify-center text-5xl mb-6 shadow-inner border border-white/5">
          📱
        </div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 mb-4 tracking-tight">Scan QR Code</h1>
        <p className="text-zinc-400 mb-8 font-medium leading-relaxed">
          Open your phone's camera or QR code scanner and scan the QR code at your coffee shop counter.
        </p>
        
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 p-5 rounded-xl mb-8 shadow-inner">
          <p className="text-sm font-semibold text-amber-500 tracking-wide">
            You'll be automatically directed to the loyalty stamp page once you scan!
          </p>
        </div>
        
        <Link
          href="/"
          className="inline-block btn-amber py-4 px-10 rounded-xl text-lg shadow-lg w-full sm:w-auto hover:shadow-amber-500/30"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
