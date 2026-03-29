'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SidebarProps {
  shopId?: string;
  shopName?: string;
}

export function Sidebar({ shopId, shopName }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('brew_sidebar_collapsed');
    setIsCollapsed(saved === 'true');
    setMounted(true);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('brew_sidebar_collapsed', String(newState));
  };

  if (!mounted) return null;

  const navItems = [
    { icon: '🏪', label: 'My Shops', href: '/my-shops' },
  ];

  const shopItems = shopId ? [
    { icon: '📊', label: 'Dashboard', href: `/admin/${shopId}` },
    { icon: '🖨️', label: 'Print QR', href: `/print-qr/${shopId}` },
  ] : [];

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.5)] transition"
      >
        <div className="w-5 h-4 flex flex-col justify-between">
          <div className="w-full h-0.5 bg-stone-950"></div>
          <div className="w-full h-0.5 bg-stone-950"></div>
          <div className="w-full h-0.5 bg-stone-950"></div>
        </div>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:sticky top-20 border-r border-white/10 flex flex-col transition-all duration-300 z-40 bg-stone-900/40 backdrop-blur-xl h-[calc(100vh-5rem)] ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-800/50 text-stone-300 hover:text-amber-400 transition group"
              onClick={() => setIsMobileOpen(false)}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
              {!isCollapsed && <span className="text-sm font-semibold tracking-wide">{item.label}</span>}
            </Link>
          ))}

          {/* Shop Section */}
          {shopId && shopItems.length > 0 && (
            <>
              <div className="h-px bg-white/10 my-6" />
              {shopName && !isCollapsed && (
                <div className="px-3 py-2 text-xs font-bold text-amber-500/80 uppercase tracking-widest mb-2">
                  {shopName}
                </div>
              )}
              {shopItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-800/50 text-stone-300 hover:text-amber-400 transition group"
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                  {!isCollapsed && <span className="text-sm font-semibold tracking-wide">{item.label}</span>}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center px-3 py-3 rounded-xl hover:bg-stone-800/50 text-stone-400 hover:text-amber-400 transition"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <span className="text-lg">▶</span>
            ) : (
              <span className="text-lg">◀</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
