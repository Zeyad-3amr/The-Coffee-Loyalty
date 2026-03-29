import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex-1 w-full flex flex-col items-center">
      {/* Hero Section */}
      <div className="w-full max-w-6xl mx-auto px-6 pt-32 pb-20 relative">
        <div className="relative z-10 max-w-3xl mx-auto text-center mb-28">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            The Future of Coffee Loyalty
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-zinc-100 mb-6 leading-tight tracking-tight">
            Digital Loyalty for <br />
            <span className="text-amber-500">
              Coffee Shops
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mb-10 font-normal leading-relaxed max-w-2xl mx-auto">
            No apps. No hassle. Just scan, collect stamps, and earn free coffee. Elevate your customer experience instantly.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/setup"
              className="btn-amber w-full sm:w-auto"
            >
              Start Earning Loyalty
            </Link>
            <Link
              href="/scan"
              className="btn-amber-outlined w-full sm:w-auto"
            >
              I'm a Customer
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 py-20 relative z-10 w-full">
          {[
            { icon: '🎯', title: 'Seamless Setup', desc: 'Create your digital shop in seconds. Get your unique QR code instantly without any technical knowledge.' },
            { icon: '📱', title: 'Mobile Native', desc: 'Customers scan natively with their phone camera. Absolutely no app download or sign-up required.' },
            { icon: '📈', title: 'Rich Analytics', desc: 'Track customer retention and reward distribution from your intuitive admin dashboard.' },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="glass-card-hover p-8 flex flex-col items-start"
            >
              <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-zinc-100 mb-3">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="py-24 relative z-10 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-4 tracking-tight">How It Works</h2>
            <p className="text-zinc-400 text-lg">Four simple steps to modernize your reward system</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Create Shop', desc: 'Enter your shop name. That\'s it.' },
              { num: '2', title: 'Display QR', desc: 'Print and place the code at your register.' },
              { num: '3', title: 'Scan & Stamp', desc: 'Customers scan to securely log their visit.' },
              { num: '4', title: 'Reward', desc: 'Automatic tracking for their free coffee.' },
            ].map((step, idx) => (
              <div
                key={idx}
                className="relative group h-full"
              >
                <div className="glass-card p-6 h-full hover:border-amber-500/50 transition-colors">
                  <div className="text-5xl font-bold text-zinc-800 absolute top-4 right-6 group-hover:text-amber-500/20 transition-colors select-none">
                    {step.num}
                  </div>
                  <div className="relative z-10 mt-8">
                    <h3 className="text-lg font-semibold text-zinc-100 mb-2">{step.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="relative w-full rounded-2xl overflow-hidden mt-10 mb-24 glass-card bg-zinc-900/80">
          <div className="relative z-10 px-8 py-20 text-center max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold text-zinc-100 mb-6 tracking-tight">
              Ready to boost your retention?
            </h3>
            <p className="text-lg text-zinc-400 mb-10 font-normal">
              Join the simple platform for modern coffee shops. Start for free. No credit card required.
            </p>
            <Link
              href="/setup"
              className="inline-flex btn-amber w-full sm:w-auto px-8"
            >
              Create Your Shop Now
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full border-t border-zinc-800/50 pt-10 pb-6 flex flex-col md:flex-row items-center justify-between text-zinc-500 text-sm">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <span className="text-amber-500 text-lg">☕</span> 
            <span className="font-semibold text-zinc-400">Brew Loyalty</span>
          </div>
          <p>© {new Date().getFullYear()} Brew. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
