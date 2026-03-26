export default function ScanPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-4">📱</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Scan QR Code</h1>
        <p className="text-gray-600 mb-6">
          Open your phone's camera or QR code scanner and scan the QR code at your coffee shop counter.
        </p>
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded mb-6">
          <p className="text-sm text-blue-800">
            You'll be automatically directed to the loyalty stamp page once you scan!
          </p>
        </div>
        <a
          href="/"
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
