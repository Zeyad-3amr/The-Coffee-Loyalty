'use client';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-red-50 to-orange-50 px-4">
      <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
        <div className="text-6xl mb-4">☕😢</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h1>
        <p className="text-gray-700 mb-6 bg-red-50 p-4 rounded border-l-4 border-red-500 text-left">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
