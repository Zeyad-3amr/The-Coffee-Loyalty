export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <span>☕</span>
            Coffee Loyalty
          </h1>
          <p className="text-gray-600 mt-2">Digital stamp card for your coffee shop</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-bold text-gray-900 mb-2">For Customers</h3>
            <p className="text-gray-600 text-sm">
              Scan QR code at checkout, collect digital stamps, and earn free coffee after 10 purchases
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">🛍️</div>
            <h3 className="font-bold text-gray-900 mb-2">Easy Setup</h3>
            <p className="text-gray-600 text-sm">
              Shop owners can create an account in seconds and start accepting scans
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-bold text-gray-900 mb-2">Track Progress</h3>
            <p className="text-gray-600 text-sm">
              Manage customers, view analytics, and handle rewards from your dashboard
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <a
            href="/setup"
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-6 px-8 rounded-lg text-center transition shadow-lg"
          >
            <div className="text-3xl mb-2">🚀</div>
            Setup Your Coffee Shop
            <p className="text-sm font-normal mt-2 opacity-90">
              Create your shop and get a QR code
            </p>
          </a>
          <a
            href="/scan"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-6 px-8 rounded-lg text-center transition shadow-lg"
          >
            <div className="text-3xl mb-2">📱</div>
            I'm a Customer
            <p className="text-sm font-normal mt-2 opacity-90">
              Scan a QR code to collect stamps
            </p>
          </a>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Shop Owner Sets Up</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Visit /setup, enter your shop name, and generate a QR code. Print it and display at your counter.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Customer Scans</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Customer scans your QR code with their phone, enters their number, and gets a digital stamp.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Collect 10 Stamps</h3>
                <p className="text-gray-600 text-sm mt-1">
                  After 10 purchases, customer gets a free coffee reward that's valid for 7 minutes.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Claim Reward</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Customer shows their animated reward screen to the cashier and gets their free coffee.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            Built with Next.js • Powered by Supabase • No app download required
          </p>
        </div>
      </div>
    </div>
  );
}
