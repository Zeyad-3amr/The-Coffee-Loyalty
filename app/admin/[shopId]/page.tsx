'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { validateEgyptPhoneNumber, formatPhoneNumber } from '@/app/lib/utils';
import { ErrorDisplay } from '@/app/components/ErrorDisplay';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';
import { CameraScanner } from '@/app/components/CameraScanner';
import { supabase } from '@/app/lib/supabase-client';

interface AdminPageProps {
  params: {
    shopId: string;
  };
}

interface Customer {
  id: string;
  phoneNumber: string;
  stampCount: number;
  totalScans: number;
  totalRewards: number;
  rewardActive: boolean;
  rewardExpiresAt: string | null;
  lastScannedAt: string | null;
}

interface AdminData {
  success?: boolean;
  error?: string;
  shop?: {
    id: string;
    name: string;
    qrCode: string;
    logoUrl?: string | null;
    walletEnabled?: boolean;
  };
  customers?: Customer[];
  totals?: {
    totalCustomers: number;
    totalStampsGiven: number;
    totalRewardsGiven: number;
    totalActiveRewards: number;
  };
}

type PageState = 'loading' | 'display' | 'error';

export default function AdminPage({ params }: AdminPageProps) {
  const { shopId } = params;
  const [pageState, setPageState] = useState<PageState>('loading');
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualError, setManualError] = useState('');
  const [isAddingStamp, setIsAddingStamp] = useState(false);
  const [isRefreshingTable, setIsRefreshingTable] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'stamps' | 'scans' | 'rewards'>('recent');

  useEffect(() => {
    fetchAdminData();
  }, [shopId]);

  const fetchAdminData = async () => {
    try {
      const response = await fetch(`/api/admin/${shopId}`);
      const data: AdminData = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load shop data');
        setPageState('error');
        return;
      }

      if (data.success) {
        setAdminData(data);
        setPageState('display');
      } else {
        setError(data.error || 'Failed to load shop data');
        setPageState('error');
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Something went wrong, please try again');
      setPageState('error');
    }
  };

  const refreshTable = async () => {
    setIsRefreshingTable(true);
    try {
      const response = await fetch(`/api/admin/${shopId}`);
      const data: AdminData = await response.json();
      if (data.success) setAdminData(data);
    } catch (err) {
      console.error('Error refreshing table:', err);
    } finally {
      setIsRefreshingTable(false);
    }
  };

  const handleAddManualStamp = async () => {
    setManualError('');

    const validation = validateEgyptPhoneNumber(manualPhone);
    if (!validation.isValid) {
      setManualError(validation.error || 'Invalid phone number');
      return;
    }

    setIsAddingStamp(true);

    try {
      const response = await fetch('/api/manual-stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: manualPhone, shopId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setManualError(data.error || 'Failed to add stamp');
        return;
      }

      setManualPhone('');
      await fetchAdminData();
    } catch (err) {
      console.error('Error adding manual stamp:', err);
      setManualError('Something went wrong');
    } finally {
      setIsAddingStamp(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setLogoError('File too large. Max 2MB.');
      return;
    }

    setIsUploadingLogo(true);
    setLogoError('');

    try {
      const ext = file.name.split('.').pop();
      const path = `${shopId}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-logos')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shop-logos')
        .getPublicUrl(path);

      const res = await fetch(`/api/shop/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: publicUrl }),
      });

      if (!res.ok) throw new Error('Failed to save logo URL');

      setAdminData(prev => prev ? {
        ...prev,
        shop: prev.shop ? { ...prev.shop, logoUrl: publicUrl } : prev.shop,
      } : prev);
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setLogoError(err.message || 'Upload failed. Make sure the shop-logos bucket exists in Supabase Storage.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleWalletScan = async (stampId: string) => {
    setShowScanner(false);
    setScanStatus('idle');

    try {
      const response = await fetch('/api/wallet-stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stampId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setScanStatus('error');
        setScanMessage(data.error || 'Failed to add stamp');
      } else {
        setScanStatus('success');
        setScanMessage(`Stamp added! ${data.stampCount}/10${data.rewardActive ? ' — Free coffee earned! 🎉' : ''}`);
        await fetchAdminData();
      }
    } catch {
      setScanStatus('error');
      setScanMessage('Something went wrong');
    }

    setTimeout(() => setScanStatus('idle'), 4000);
  };

  if (pageState === 'loading') {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (pageState === 'error') {
    return <ErrorDisplay error={error} onRetry={fetchAdminData} />;
  }

  if (!adminData) {
    return null;
  }

  const allCustomers = adminData.customers ?? [];
  const normalizedQuery = searchQuery.replace(/\D/g, '');
  const filteredCustomers = allCustomers
    .filter((c) =>
      normalizedQuery === '' ? true : c.phoneNumber.replace(/\D/g, '').includes(normalizedQuery),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'stamps':
          return b.stampCount - a.stampCount;
        case 'scans':
          return b.totalScans - a.totalScans;
        case 'rewards':
          return b.totalRewards - a.totalRewards;
        case 'recent':
        default: {
          const aTime = a.lastScannedAt ? new Date(a.lastScannedAt).getTime() : 0;
          const bTime = b.lastScannedAt ? new Date(b.lastScannedAt).getTime() : 0;
          return bTime - aTime;
        }
      }
    });

  return (
    <div className="flex flex-col w-full min-h-screen">
      {showScanner && (
        <CameraScanner
          onScan={handleWalletScan}
          onClose={() => setShowScanner(false)}
        />
      )}
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#e7d3b8]/85 backdrop-blur-md border-b border-stone-700/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="shrink-0" aria-label="Rekur">
              <img src="/logo-large.svg" alt="Rekur" className="h-8 w-8" />
            </Link>
            <div className="h-6 w-px bg-stone-700/20 shrink-0" />
            {adminData?.shop?.logoUrl ? (
              <div className="w-8 h-8 rounded-full bg-white border border-stone-700/20 overflow-hidden shrink-0">
                <img src={adminData.shop.logoUrl} alt="" className="w-full h-full object-contain p-0.5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-amber-700">
                  <path d="M3 8h14a3 3 0 0 1 0 6h-1"/><path d="M3 8v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8"/><path d="M7 4v2M11 4v2M15 4v2"/>
                </svg>
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <div className="text-[15px] font-semibold text-stone-900 truncate">
                {adminData?.shop?.name}
              </div>
              <div className="text-xs text-stone-500">Dashboard</div>
            </div>
          </div>
          <a
            href={`/display-qr/${shopId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-stone-700 hover:text-stone-900 hover:bg-stone-700/5 transition whitespace-nowrap"
          >
            Live display
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
              <path d="M7 17 17 7M9 7h8v8"/>
            </svg>
          </a>
        </div>
      </header>

      <div className="relative flex-1">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-5">

          {/* Apple Wallet scanner */}
          {adminData?.shop?.walletEnabled && (
            <section className="bg-[#fbf3e7] border border-stone-700/10 rounded-xl p-5 sm:p-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-stone-900 text-amber-300">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                      <path d="M17.045 13.86c-.028-2.947 2.408-4.372 2.518-4.44-1.376-2.01-3.513-2.285-4.27-2.313-1.815-.184-3.55 1.073-4.472 1.073-.922 0-2.343-1.047-3.852-1.018-1.973.03-3.8 1.148-4.822 2.908-2.058 3.568-.528 8.848 1.474 11.741.98 1.416 2.148 3.004 3.682 2.947 1.48-.058 2.036-.95 3.823-.95 1.787 0 2.29.95 3.842.921 1.593-.028 2.602-1.44 3.573-2.862 1.132-1.633 1.594-3.22 1.622-3.302-.035-.015-3.105-1.19-3.134-4.706zM14.23 5.18c.812-.986 1.36-2.353 1.21-3.718-1.17.047-2.587.78-3.43 1.763-.755.867-1.415 2.262-1.237 3.594 1.306.101 2.64-.663 3.457-1.64z"/>
                    </svg>
                  </span>
                  <h2 className="text-[17px] font-semibold tracking-tight text-stone-900">Scan Apple Wallet card</h2>
                </div>
                <p className="text-sm text-stone-500 mt-1.5 mb-4 ml-9">
                  Use the camera to scan the customer's wallet pass and add a stamp.
                </p>
                <button
                  onClick={() => { setShowScanner(true); setScanStatus('idle'); }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#1c1410] hover:bg-[#2a1c12] text-amber-300 transition"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <path d="M2 8V6a2 2 0 0 1 2-2h2M22 8V6a2 2 0 0 0-2-2h-2M2 16v2a2 2 0 0 0 2 2h2M22 16v2a2 2 0 0 1-2 2h-2"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  Open camera
                </button>
                {scanStatus === 'success' && (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-100/60 border border-green-300/60 px-3 py-1.5 rounded-md">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M20 6 9 17l-5-5"/></svg>
                    {scanMessage}
                  </p>
                )}
                {scanStatus === 'error' && (
                  <p className="mt-3 inline-block text-sm text-red-700 bg-red-100/60 border border-red-300/60 px-3 py-1.5 rounded-md">
                    {scanMessage}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Manual stamp */}
          <section className="bg-[#fbf3e7] border border-stone-700/10 rounded-xl p-5 sm:p-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100/60 border border-amber-200/70 text-amber-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
                </span>
                <h2 className="text-[17px] font-semibold tracking-tight text-stone-900">Add a stamp</h2>
              </div>
              <p className="text-sm text-stone-500 mt-1.5 mb-4 ml-9">
                Enter the customer's phone number to add one stamp.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="tel"
                  value={manualPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setManualPhone(value);
                    setManualError('');
                  }}
                  placeholder="01012345678"
                  maxLength={11}
                  className={`flex-1 px-3.5 py-2.5 text-[15px] bg-white border rounded-lg font-mono tracking-wide text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 transition ${
                    manualError
                      ? 'border-red-400/60 focus:ring-red-300'
                      : 'border-stone-700/15 focus:ring-amber-300 focus:border-amber-400'
                  }`}
                />
                <button
                  onClick={handleAddManualStamp}
                  disabled={manualPhone.length !== 11 || isAddingStamp}
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-900 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isAddingStamp ? 'Adding…' : 'Add stamp'}
                </button>
              </div>
              {manualError && <p className="text-sm text-red-600 mt-2">{manualError}</p>}
            </div>
          </section>

          {/* Stats — each card has a semantic color tint that describes its meaning */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Customers',
                value: adminData?.totals?.totalCustomers ?? 0,
                tint: 'bg-sky-100/60 text-sky-700 border-sky-200/70',
                accent: 'text-sky-700',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
              },
              {
                label: 'Stamps given',
                value: adminData?.totals?.totalStampsGiven ?? 0,
                tint: 'bg-amber-100/60 text-amber-700 border-amber-200/70',
                accent: 'text-amber-700',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>
                  </svg>
                ),
              },
              {
                label: 'Free coffees',
                value: adminData?.totals?.totalRewardsGiven ?? 0,
                tint: 'bg-orange-100/60 text-orange-700 border-orange-200/70',
                accent: 'text-orange-700',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <path d="M3 8h14a3 3 0 0 1 0 6h-1"/><path d="M3 8v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8"/><path d="M7 4v2M11 4v2M15 4v2"/>
                  </svg>
                ),
              },
              {
                label: 'Active rewards',
                value: adminData?.totals?.totalActiveRewards ?? 0,
                tint: (adminData?.totals?.totalActiveRewards ?? 0) > 0
                  ? 'bg-green-100/60 text-green-700 border-green-200/70'
                  : 'bg-stone-100/60 text-stone-500 border-stone-200/60',
                accent: (adminData?.totals?.totalActiveRewards ?? 0) > 0 ? 'text-green-700' : 'text-stone-500',
                live: (adminData?.totals?.totalActiveRewards ?? 0) > 0,
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <path d="M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/>
                  </svg>
                ),
              },
            ].map((s) => (
              <div key={s.label} className="relative bg-[#fbf3e7] border border-stone-700/10 rounded-xl px-4 py-4 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${s.tint}`}>
                    {s.icon}
                  </span>
                  {s.live && (
                    <span className="relative flex h-2 w-2" aria-label="Live">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                  )}
                </div>
                <div className={`text-[28px] leading-none font-semibold tabular-nums tracking-tight ${s.accent}`}>
                  {s.value}
                </div>
                <div className="text-[13px] text-stone-500 mt-1.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Customers */}
          <section className="bg-[#fbf3e7] border border-stone-700/10 rounded-xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-stone-700/10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-sky-100/60 border border-sky-200/70 text-sky-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </span>
                <h2 className="text-[17px] font-semibold tracking-tight text-stone-900">Customers</h2>
                <span className="text-sm text-stone-500 tabular-nums">
                  {normalizedQuery
                    ? `${filteredCustomers.length} of ${allCustomers.length}`
                    : allCustomers.length}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none">
                    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="search"
                    inputMode="numeric"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search phone number"
                    className="w-full sm:w-64 pl-9 pr-8 py-2 text-sm bg-white border border-stone-700/15 rounded-lg font-mono text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 rounded transition"
                      aria-label="Clear search"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="py-2 px-3 text-sm bg-white border border-stone-700/15 rounded-lg text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition cursor-pointer"
                >
                  <option value="recent">Most recent</option>
                  <option value="stamps">Most stamps</option>
                  <option value="scans">Most scans</option>
                  <option value="rewards">Most rewards</option>
                </select>
                <button
                  onClick={refreshTable}
                  disabled={isRefreshingTable}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg text-stone-700 hover:bg-stone-700/5 transition disabled:opacity-50"
                  aria-label="Refresh"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`w-4 h-4 ${isRefreshingTable ? 'animate-spin' : ''}`}>
                    <path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>
                  </svg>
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-700/10 bg-[#f5e9d5]/40">
                    <th className="px-5 sm:px-6 py-2.5 text-xs font-medium text-stone-500">Phone</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-stone-500">Stamps</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-stone-500">Scans</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-stone-500">Rewards</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-stone-500">Status</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-stone-500">Last visit</th>
                  </tr>
                </thead>
                <tbody>
                  {allCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center text-stone-500">
                        <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-stone-700/5 flex items-center justify-center text-stone-400">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                        </div>
                        <p className="text-sm">No customers yet. They'll appear here after their first stamp.</p>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center text-stone-500">
                        <p className="text-sm">No customers match "{searchQuery}".</p>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-sm text-amber-700 hover:text-amber-800 underline underline-offset-2"
                        >
                          Clear search
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => {
                      // Color the progress bar based on how close to a reward
                      const progress = customer.stampCount / 10;
                      const barColor =
                        customer.stampCount >= 8 ? 'bg-orange-500'   // 8-9: warm — almost there
                        : customer.stampCount >= 4 ? 'bg-amber-500'  // 4-7: building up
                        : 'bg-amber-300';                            // 0-3: just starting
                      const countColor =
                        customer.stampCount >= 8 ? 'text-orange-700 font-semibold'
                        : customer.stampCount >= 4 ? 'text-amber-700'
                        : 'text-stone-500';

                      return (
                      <tr key={customer.id} className="border-b border-stone-700/5 last:border-b-0 hover:bg-stone-700/[0.03] transition-colors">
                        <td className="px-5 sm:px-6 py-3.5 text-sm font-mono text-stone-900 tabular-nums whitespace-nowrap">
                          {formatPhoneNumber(customer.phoneNumber)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 w-28">
                            <div className="flex-1 h-1.5 rounded-full bg-stone-700/10 overflow-hidden">
                              <div
                                className={`h-full ${barColor} rounded-full transition-all`}
                                style={{ width: `${progress * 100}%` }}
                              />
                            </div>
                            <span className={`text-xs tabular-nums ${countColor}`}>{customer.stampCount}/10</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-700 tabular-nums">{customer.totalScans}</td>
                        <td className="px-4 py-3.5">
                          {customer.totalRewards > 0 ? (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-700 tabular-nums">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                <path d="M3 8h14a3 3 0 0 1 0 6h-1"/><path d="M3 8v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8"/><path d="M7 4v2M11 4v2M15 4v2"/>
                              </svg>
                              {customer.totalRewards}
                            </span>
                          ) : (
                            <span className="text-sm text-stone-400 tabular-nums">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {customer.rewardActive ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100/60 border border-green-300/60 px-2 py-0.5 rounded-full">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                              </span>
                              Reward ready
                            </span>
                          ) : customer.stampCount >= 8 ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-100/60 border border-orange-300/60 px-2 py-0.5 rounded-full">
                              Almost there
                            </span>
                          ) : (
                            <span className="text-sm text-stone-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-500">
                          {customer.lastScannedAt
                            ? new Date(customer.lastScannedAt).toLocaleDateString('en-EG', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Shop logo — settings */}
          <section className="bg-transparent border-t border-stone-700/10 pt-6 mt-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-stone-100 border border-stone-200 text-stone-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                  <path d="m21 11-2-7H5L3 11M21 11v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9M21 11H3M12 4v7"/>
                </svg>
              </span>
              <h2 className="text-[17px] font-semibold tracking-tight text-stone-900">Shop logo</h2>
            </div>
            <p className="text-sm text-stone-500 mt-1.5 mb-4 ml-9">Appears on your dashboard, scan page, and QR poster.</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-white border border-stone-700/15 flex items-center justify-center overflow-hidden shrink-0">
                {adminData?.shop?.logoUrl ? (
                  <img src={adminData.shop.logoUrl} alt="" className="w-full h-full object-contain p-1" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5 text-stone-400">
                    <path d="m21 11-2-7H5L3 11M21 11v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9M21 11H3M12 4v7"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md bg-[#1c1410] hover:bg-[#2a1c12] text-amber-300 transition cursor-pointer ${
                    isUploadingLogo ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                  />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                  {isUploadingLogo ? 'Uploading…' : adminData?.shop?.logoUrl ? 'Change logo' : 'Upload logo'}
                </label>
                <span className="text-xs text-stone-500">PNG, JPG, SVG · max 2 MB</span>
                {logoError && <p className="w-full text-sm text-red-600">{logoError}</p>}
              </div>
            </div>
          </section>
        </div>
      </main>
      </div>
    </div>
  );
}
