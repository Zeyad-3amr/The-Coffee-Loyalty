'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/app/components/Sidebar';

interface Shop {
  id: string;
  name: string;
  createdAt: string;
}

interface ShopWithStats extends Shop {
  totalCustomers?: number;
  totalStamps?: number;
  loading?: boolean;
  error?: string;
}

export default function MyShopsPage() {
  const [shops, setShops] = useState<ShopWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load shops from localStorage
    const stored = localStorage.getItem('brew_shops');
    const shopList: Shop[] = stored ? JSON.parse(stored) : [];

    setShops(shopList.map(shop => ({ ...shop, loading: true })));
    setLoading(false);

    // Fetch stats for each shop
    shopList.forEach(shop => {
      fetch(`/api/admin/${shop.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.totals) {
            setShops(prev =>
              prev.map(s =>
                s.id === shop.id
                  ? {
                      ...s,
                      totalCustomers: data.totals.totalCustomers,
                      totalStamps: data.totals.totalStampsGiven,
                      loading: false,
                    }
                  : s
              )
            );
          }
        })
        .catch(() => {
          setShops(prev =>
            prev.map(s =>
              s.id === shop.id ? { ...s, loading: false, error: 'Failed to load' } : s
            )
          );
        });
    });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-5xl mb-6 animate-bounce drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">☕</div>
          <p className="text-stone-400 text-lg font-medium animate-pulse">Brewing your shops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-full bg-stone-950 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 z-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400 tracking-tight">
              My Shops
            </h1>
            <p className="text-stone-400 mt-2 text-lg">Manage your premium coffee loyalty programs</p>
          </div>
          <Link
            href="/setup"
            className="btn-amber px-8 py-3.5 rounded-full flex items-center justify-center gap-2 shadow-lg"
          >
            <span className="text-xl leading-none -mt-1">+</span> Create New
          </Link>
        </div>

        {/* Content */}
        {shops.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-32 px-6 text-center animate-fadeUp">
            <div className="w-24 h-24 bg-stone-900 border border-white/5 rounded-3xl flex items-center justify-center text-5xl mb-8 shadow-inner shadow-black/50">
              📍
            </div>
            <h2 className="text-3xl font-bold text-stone-100 mb-4">No shops created yet</h2>
            <p className="text-stone-400 text-lg mb-10 max-w-md">
              Start building customer loyalty today by creating your first coffee shop. It only takes seconds.
            </p>
            <Link
              href="/setup"
              className="btn-amber px-10 py-4 rounded-full text-lg shadow-xl shadow-amber-500/20"
            >
              Create Your First Shop
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop, idx) => (
              <div
                key={shop.id}
                className="glass-card-hover p-8 animate-fadeUp group relative"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Shop Header */}
                <h3 className="text-2xl font-bold text-stone-100 mb-2 truncate group-hover:text-amber-400 transition-colors">
                  {shop.name}
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-8">
                  Created {new Date(shop.createdAt).toLocaleDateString()}
                </p>

                {/* Stats */}
                {shop.loading ? (
                  <div className="space-y-4 mb-8">
                    <div className="h-4 bg-stone-800/50 rounded-full animate-pulse" />
                    <div className="h-4 bg-stone-800/50 rounded-full w-2/3 animate-pulse" />
                  </div>
                ) : shop.error ? (
                  <div className="text-red-400 text-sm mb-8 bg-red-400/10 p-3 rounded-xl border border-red-400/20">{shop.error}</div>
                ) : (
                  <div className="space-y-4 mb-8 bg-stone-900/50 p-5 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400 font-medium">Customers</span>
                      <span className="text-2xl font-black text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                        {shop.totalCustomers || 0}
                      </span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400 font-medium">Total Stamps</span>
                      <span className="text-2xl font-black text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                        {shop.totalStamps || 0}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  <Link
                    href={`/admin/${shop.id}`}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40"
                  >
                    Open Dashboard <span className="text-xl leading-none">→</span>
                  </Link>
                  <Link
                    href={`/print-qr/${shop.id}`}
                    target="_blank"
                    className="w-full bg-stone-900 hover:bg-stone-800 text-stone-300 font-semibold py-3.5 rounded-xl transition flex items-center justify-center border border-white/10 hover:border-amber-500/30"
                  >
                    Print QR Code
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
