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
    { icon: '🏠', label: 'Home', href: '/' },
    { icon: '🏪', label: 'My Shops', href: '/my-shops' },
    { icon: '➕', label: 'New Shop', href: '/setup' },
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 hover:bg-zinc-800 rounded-lg transition"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <div className="w-full h-0.5 bg-amber-400"></div>
          <div className="w-full h-0.5 bg-amber-400"></div>
          <div className="w-full h-0.5 bg-amber-400"></div>
        </div>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 z-40 ${
          isCollapsed ? 'w-20' : 'w-56'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-6 hover:bg-zinc-800 transition"
          onClick={() => setIsMobileOpen(false)}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-zinc-950 font-bold text-lg flex-shrink-0">
            ☕
          </div>
          {!isCollapsed && <span className="text-xl font-bold text-amber-400">Brew</span>}
        </Link>

        {/* Divider */}
        <div className="h-px bg-zinc-800 mx-4" />

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition group"
              onClick={() => setIsMobileOpen(false)}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}

          {/* Shop Section */}
          {shopId && shopItems.length > 0 && (
            <>
              <div className="h-px bg-zinc-800 my-4" />
              {shopName && !isCollapsed && (
                <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {shopName}
                </div>
              )}
              {shopItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition"
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-zinc-800 p-3">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition"
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
