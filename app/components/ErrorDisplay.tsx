'use client';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="text-center bg-gray-50 rounded-lg p-8 max-w-md border border-gray-200">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
        <p className="text-gray-700 mb-6 bg-red-50 p-4 rounded text-sm border border-red-200">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-8 rounded-lg transition"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
