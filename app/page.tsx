export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              ☕
            </div>
            <span className="text-xl font-semibold text-gray-900">Brew</span>
          </div>
          <div className="text-sm text-gray-600">Coffee Loyalty Made Simple</div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto text-center mb-20">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Digital Loyalty Cards for Coffee Shops
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            No apps. No hassle. Just scan, collect stamps, and earn free coffee.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center">
            <a
              href="/setup"
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition transform hover:scale-105"
            >
              Create Your Shop
            </a>
            <a
              href="/scan"
              className="px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-900 font-medium rounded-lg transition"
            >
              I'm a Customer
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 py-20 border-t border-b border-gray-100">
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl">
              🎯
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Simple Setup</h3>
            <p className="text-gray-600 text-sm">Create a shop in seconds. Get your QR code instantly.</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl">
              📱
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Mobile First</h3>
            <p className="text-gray-600 text-sm">Customers scan with their phone. No app download needed.</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl">
              📊
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Real Analytics</h3>
            <p className="text-gray-600 text-sm">Track customers and rewards from your admin dashboard.</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="py-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-100 text-amber-600 font-bold">
                  1
                </div>
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Create Your Shop</h3>
                <p className="text-gray-600">Enter your coffee shop name and get a unique QR code instantly.</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-100 text-amber-600 font-bold">
                  2
                </div>
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Print & Display</h3>
                <p className="text-gray-600">Print your QR code and display it at the counter or register.</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-100 text-amber-600 font-bold">
                  3
                </div>
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Customers Scan</h3>
                <p className="text-gray-600">Customers scan the code and get a digital stamp with each purchase.</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-100 text-amber-600 font-bold">
                  4
                </div>
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Earn Rewards</h3>
                <p className="text-gray-600">After 10 stamps, they get a free coffee. It's that simple.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gray-50 rounded-2xl p-12 text-center max-w-2xl mx-auto mb-20">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to boost customer loyalty?</h3>
          <p className="text-gray-600 mb-6">Start for free. No credit card required.</p>
          <a
            href="/setup"
            className="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition transform hover:scale-105"
          >
            Create Your Shop Now
          </a>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-8 text-center text-gray-600 text-sm">
          <p>Built with Next.js • Powered by Supabase • No app download required</p>
        </div>
      </div>
    </div>
  );
}
