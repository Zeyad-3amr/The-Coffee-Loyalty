import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <nav className="border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-zinc-950 font-bold text-lg">
              ☕
            </div>
            <span className="text-xl font-bold text-amber-400">Brew</span>
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm text-zinc-400">Digital Loyalty Made Simple</span>
            <Link href="/my-shops" className="text-sm text-amber-400 hover:text-amber-300 font-medium">
              My Shops
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto text-center mb-20">
          <h1 className="text-5xl lg:text-6xl font-bold text-zinc-100 mb-4 animate-fadeUp">
            Digital Loyalty Cards for Coffee Shops
          </h1>
          <p className="text-xl text-zinc-400 mb-8 animate-fadeUp stagger-delay-1">
            No apps. No hassle. Just scan, collect stamps, and earn free coffee.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center flex-wrap animate-fadeUp stagger-delay-2">
            <Link
              href="/setup"
              className="px-8 py-4 btn-amber rounded-lg font-medium hover:shadow-lg hover:shadow-amber-500/30 transition duration-300"
            >
              Create Your Shop
            </Link>
            <Link
              href="/scan"
              className="px-8 py-4 border border-zinc-700 text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 font-medium rounded-lg transition"
            >
              I'm a Customer
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 py-20 border-t border-b border-zinc-800">
          {[
            { icon: '🎯', title: 'Simple Setup', desc: 'Create a shop in seconds. Get your QR code instantly.' },
            { icon: '📱', title: 'Mobile First', desc: 'Customers scan with their phone. No app download needed.' },
            { icon: '📊', title: 'Real Analytics', desc: 'Track customers and rewards from your admin dashboard.' },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="text-center card-dark p-8 rounded-lg animate-fadeUp"
              style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-zinc-100 mb-2">{feature.title}</h3>
              <p className="text-zinc-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="py-20 max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-zinc-100 text-center mb-16 animate-fadeUp">How It Works</h2>

          <div className="space-y-8">
            {[
              { num: '1', title: 'Create Your Shop', desc: 'Enter your coffee shop name and get a unique QR code instantly.' },
              { num: '2', title: 'Print & Display', desc: 'Print your QR code and display it at the counter or register.' },
              { num: '3', title: 'Customers Scan', desc: 'Customers scan the code and get a digital stamp with each purchase.' },
              { num: '4', title: 'Earn Rewards', desc: 'After 10 stamps, they get a free coffee. It\'s that simple.' },
            ].map((step, idx) => (
              <div
                key={idx}
                className="flex gap-6 animate-fadeUp"
                style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-bold text-lg">
                    {step.num}
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-1">{step.title}</h3>
                  <p className="text-zinc-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="card-dark rounded-2xl p-12 text-center max-w-2xl mx-auto mb-20 border-amber-500/20 border animate-fadeUp stagger-delay-5">
          <h3 className="text-2xl font-bold text-zinc-100 mb-3">Ready to boost customer loyalty?</h3>
          <p className="text-zinc-400 mb-8">Start for free. No credit card required.</p>
          <Link
            href="/setup"
            className="inline-block px-8 py-4 btn-amber rounded-lg font-medium hover:shadow-lg hover:shadow-amber-500/30 transition duration-300"
          >
            Create Your Shop Now
          </Link>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 pt-8 text-center text-zinc-500 text-sm">
          <p>Built with Next.js • Powered by Supabase • No app download required</p>
        </div>
      </div>
    </div>
  );
}
