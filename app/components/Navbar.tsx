'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 pointer-events-auto ${
        scrolled 
          ? 'bg-stone-950/80 backdrop-blur-md border-b border-white/5 py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link 
          href="/" 
          className="group flex items-center gap-3 transition-transform hover:scale-105 duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center text-stone-950 font-black text-xl shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
            ☕
          </div>
          <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-stone-100 to-stone-400 tracking-tight">
            Brew
          </span>
        </Link>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6">
            <NavLink href="/" active={pathname === '/'}>Home</NavLink>
            <NavLink href="/scan" active={pathname.startsWith('/scan')}>For Customers</NavLink>
            <NavLink href="/my-shops" active={pathname.startsWith('/my-shops')}>My Shops</NavLink>
          </div>
          <Link
            href="/setup"
            className="group relative px-6 py-2.5 rounded-full font-semibold overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-300 transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-amber-400 opacity-0 group-hover:opacity-20 transition-opacity blur" />
            <span className="relative text-stone-950">Create Shop</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={`text-sm font-medium transition-colors hover:text-amber-400 relative ${
        active ? 'text-amber-400' : 'text-stone-400'
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
      )}
    </Link>
  );
}
