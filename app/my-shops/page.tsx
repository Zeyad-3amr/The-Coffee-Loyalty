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
      <div className="min-h-screen bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-bounce">☕</div>
            <p className="text-zinc-400">Loading your shops...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100">My Shops</h1>
              <p className="text-zinc-400 mt-1">Manage your coffee loyalty programs</p>
            </div>
            <Link
              href="/setup"
              className="btn-amber px-6 py-2.5 rounded-lg flex items-center gap-2"
            >
              + Create New
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
        {shops.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📍</div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-3">No shops yet</h2>
            <p className="text-zinc-400 mb-8">Create your first coffee shop loyalty program</p>
            <Link
              href="/setup"
              className="btn-amber px-8 py-3 rounded-lg inline-block"
            >
              Create Your First Shop
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop, idx) => (
              <div
                key={shop.id}
                className="card-dark p-6 hover:border-amber-500/50 hover:shadow-amber-500/20 hover:-translate-y-1 transition-all duration-300 animate-fadeUp"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Shop Header */}
                <h3 className="text-xl font-bold text-zinc-100 mb-1 truncate">{shop.name}</h3>
                <p className="text-xs text-zinc-500 mb-4">
                  Created {new Date(shop.createdAt).toLocaleDateString()}
                </p>

                {/* Stats */}
                {shop.loading ? (
                  <div className="space-y-2 mb-6">
                    <div className="h-4 bg-zinc-800 rounded animate-shimmer" />
                    <div className="h-4 bg-zinc-800 rounded animate-shimmer" />
                  </div>
                ) : shop.error ? (
                  <div className="text-red-400 text-sm mb-6">{shop.error}</div>
                ) : (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Customers</span>
                      <span className="text-lg font-bold text-amber-400">{shop.totalCustomers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Total Stamps</span>
                      <span className="text-lg font-bold text-amber-400">{shop.totalStamps || 0}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <Link
                    href={`/admin/${shop.id}`}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    Open Dashboard →
                  </Link>
                  <Link
                    href={`/print-qr/${shop.id}`}
                    target="_blank"
                    className="w-full border border-zinc-700 hover:border-amber-500/50 text-zinc-300 hover:text-amber-400 font-medium py-2.5 rounded-lg transition"
                  >
                    Print QR Code
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
