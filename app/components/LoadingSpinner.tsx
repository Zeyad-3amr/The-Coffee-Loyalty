export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-5">
        {/* Spinner ring with logo inside */}
        <div className="relative w-20 h-20">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full border-4 border-stone-800" />
          {/* Spinning amber arc */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 border-r-amber-500/30 animate-spin" />
          {/* Logo in center */}
          <div className="absolute inset-2 flex items-center justify-center">
            <img src="/logo-large.svg" alt="Rekur" className="w-full h-full rounded-full" />
          </div>
        </div>

        <p className="text-stone-400 text-base font-medium tracking-wide animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
