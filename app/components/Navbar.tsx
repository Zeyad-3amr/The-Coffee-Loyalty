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
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled 
          ? 'bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800' 
          : 'bg-zinc-950 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="text-2xl">
            ☕
          </div>
          <span className="text-xl font-bold text-zinc-100 tracking-tight">
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
            className="px-5 py-2 rounded-md bg-amber-600 hover:bg-amber-500 text-zinc-50 font-medium transition-colors"
          >
            Create Shop
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
      className={`text-sm font-medium transition-colors ${
        active ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      {children}
    </Link>
  );
}

