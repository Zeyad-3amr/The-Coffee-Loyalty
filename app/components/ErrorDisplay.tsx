'use client';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
      <div className="text-center card-dark p-8 max-w-md animate-fadeUp">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-4">Something went wrong</h1>
        <p className="text-zinc-300 mb-6 bg-red-950/30 p-4 rounded text-sm border border-red-900/50">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full btn-amber py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-amber-500/30 transition"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
