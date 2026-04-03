'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase-client';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

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
          className="group flex items-center transition-transform hover:scale-105 duration-300"
        >
          <img src="/logo-large.svg" alt="Rekur" className="h-14 w-14" />
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <NavLink href="/" active={pathname === '/'}>Home</NavLink>
            <NavLink href="/scan" active={pathname.startsWith('/scan')}>For Customers</NavLink>
            {user && (
              <NavLink href="/my-shops" active={pathname.startsWith('/my-shops')}>My Shops</NavLink>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden md:block text-xs text-stone-500 font-medium truncate max-w-[140px]">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-stone-300 border border-white/10 hover:border-amber-500/30 hover:text-amber-400 transition"
              >
                Logout
              </button>
            </div>
          )}
          {!pathname.startsWith('/scan') && !user && (
            <Link
              href="/auth"
              className="group relative px-6 py-2.5 rounded-full font-semibold overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-300 transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-amber-400 opacity-0 group-hover:opacity-20 transition-opacity blur" />
              <span className="relative text-stone-950">Sign In</span>
            </Link>
          )}
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
