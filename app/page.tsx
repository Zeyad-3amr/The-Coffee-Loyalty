import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex-1 w-full flex flex-col items-center">
      {/* Hero Section */}
      <div className="w-full max-w-6xl mx-auto px-6 pt-32 pb-20 relative">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center mb-28">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-amber-500/20 text-amber-400 text-sm font-medium mb-8 animate-fadeUp">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            The Future of Coffee Loyalty
          </div>
          <h1 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-stone-100 via-stone-300 to-stone-600 mb-6 animate-fadeUp stagger-delay-1 leading-tight tracking-tight">
            Digital Loyalty for <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
              Coffee Shops
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-stone-400 mb-10 animate-fadeUp stagger-delay-2 font-light leading-relaxed">
            No apps. No hassle. Just scan, collect stamps, and earn free coffee. Elevate your customer experience instantly.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-fadeUp stagger-delay-3">
            <Link
              href="/setup"
              className="px-8 py-4 btn-amber rounded-full text-lg w-full sm:w-auto"
            >
              Start Earning Loyalty
            </Link>
            <Link
              href="/scan"
              className="px-8 py-4 rounded-full btn-amber-outlined w-full sm:w-auto text-lg"
            >
              I'm a Customer
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 py-20 relative z-10 w-full animate-fadeUp stagger-delay-4">
          {[
            { icon: '🎯', title: 'Seamless Setup', desc: 'Create your digital shop in seconds. Get your unique QR code instantly without any technical knowledge.' },
            { icon: '📱', title: 'Mobile Native', desc: 'Customers scan natively with their phone camera. Absolutely no app download or sign-up required.' },
            { icon: '📈', title: 'Rich Analytics', desc: 'Track customer retention and reward distribution from your intuitive admin dashboard.' },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="glass-card-hover p-8 rounded-2xl flex flex-col items-start"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700/50 flex items-center justify-center text-2xl mb-6 shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-stone-100 mb-3">{feature.title}</h3>
              <p className="text-stone-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="py-24 relative z-10 w-full">
          <div className="text-center mb-16 animate-fadeUp">
            <h2 className="text-4xl lg:text-5xl font-bold text-stone-100 mb-4 tracking-tight">How It Works</h2>
            <p className="text-stone-400 text-lg">Four simple steps to modernize your reward system</p>
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
                className="relative animate-fadeUp group"
                style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
              >
                <div className="glass-card p-6 h-full border border-stone-800 group-hover:border-amber-500/30 transition-colors">
                  <div className="text-6xl font-black text-stone-800/50 absolute top-4 right-6 group-hover:text-amber-500/10 transition-colors select-none">
                    {step.num}
                  </div>
                  <div className="relative z-10 mt-8">
                    <h3 className="text-xl font-bold text-stone-100 mb-2">{step.title}</h3>
                    <p className="text-stone-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="relative w-full rounded-3xl overflow-hidden mt-10 mb-24 animate-fadeUp stagger-delay-5">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-orange-600/20 glass-card"></div>
          <div className="relative z-10 px-8 py-20 text-center max-w-3xl mx-auto">
            <h3 className="text-4xl lg:text-5xl font-black text-stone-100 mb-6 tracking-tight">
              Ready to boost your retention?
            </h3>
            <p className="text-xl text-stone-300 mb-10 font-light">
              Join the premium platform for modern coffee shops. Start for free. No credit card required.
            </p>
            <Link
              href="/setup"
              className="inline-block px-10 py-5 btn-amber rounded-full text-lg w-full sm:w-auto"
            >
              Create Your Shop Now
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full border-t border-stone-800/50 pt-10 pb-6 flex flex-col md:flex-row items-center justify-between text-stone-500 text-sm">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <img src="/logo-small.svg" alt="Rekur" className="h-10 w-10" />
            <span className="font-bold text-stone-300 text-lg">rekur</span>
          </div>
          <p>© {new Date().getFullYear()} Rekur. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
