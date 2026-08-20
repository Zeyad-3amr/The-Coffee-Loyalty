'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { validateEgyptPhoneNumber, formatPhoneNumber } from '@/app/lib/utils';
import { deriveBrandRamp, deriveCardColors, isValidHex, DEFAULT_BRAND_HEX, DEFAULT_BG_HEX, INK_FOR, normalizeTextMode, type TextMode } from '@/app/lib/theme';
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
    brandColor?: string | null;
    bgColor?: string | null;
    textColor?: string | null;
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

type Segment = 'ready' | 'almost' | 'new' | 'regular' | 'building';

// Derive a customer's lifecycle segment for the smart Status column + filters.
function customerSegment(c: Customer): Segment {
  if (c.rewardActive) return 'ready';
  if (c.stampCount >= 8) return 'almost';
  if (c.totalScans <= 1) return 'new';
  if (c.totalScans >= 10) return 'regular';
  return 'building';
}

// Visual config per segment (badge classes + label).
const SEGMENT_META: Record<Segment, { label: string; cls: string }> = {
  ready:    { label: 'Reward ready', cls: 'text-green-700 bg-green-100/60 border-green-300/60' },
  almost:   { label: 'Almost there', cls: 'text-orange-700 bg-orange-100/60 border-orange-300/60' },
  new:      { label: 'New',          cls: 'text-violet-700 bg-violet-100/60 border-violet-300/60' },
  regular:  { label: 'Regular',      cls: 'text-teal-700 bg-teal-100/60 border-teal-300/60' },
  building: { label: 'Building',     cls: 'text-stone-500 bg-stone-500/10 border-stone-500/20' },
};

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
  const [sortOpen, setSortOpen] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [rowStampingId, setRowStampingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [brandColor, setBrandColor] = useState<string>(DEFAULT_BRAND_HEX);
  const [bgColor, setBgColor] = useState<string>(DEFAULT_BG_HEX);
  const [textColor, setTextColor] = useState<TextMode>('dark');
  const [isSavingColor, setIsSavingColor] = useState(false);
  const [colorError, setColorError] = useState('');
  const [colorSaved, setColorSaved] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [shopId]);

  // Seed the appearance controls from the loaded shop.
  useEffect(() => {
    if (adminData?.shop?.brandColor) setBrandColor(adminData.shop.brandColor);
    if (adminData?.shop?.bgColor) setBgColor(adminData.shop.bgColor);
    if (adminData?.shop?.textColor) setTextColor(normalizeTextMode(adminData.shop.textColor));
  }, [adminData?.shop?.brandColor, adminData?.shop?.bgColor, adminData?.shop?.textColor]);

  // Live-preview the accent on the dashboard itself as the owner picks.
  useEffect(() => {
    if (!isValidHex(brandColor)) return;
    const ramp = deriveBrandRamp(brandColor);
    const root = document.documentElement;
    Object.entries(ramp).forEach(([s, v]) => root.style.setProperty(`--brand-${s}`, v));
    return () => Object.keys(ramp).forEach((s) => root.style.removeProperty(`--brand-${s}`));
  }, [brandColor]);

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

  const saveAppearance = async (next: { brandColor: string; bgColor: string; textColor: TextMode }) => {
    setColorError('');
    setColorSaved(false);
    if (!isValidHex(next.brandColor) || !isValidHex(next.bgColor)) {
      setColorError('Enter valid hex colors, e.g. #f59e0b');
      return;
    }
    setIsSavingColor(true);
    try {
      const res = await fetch(`/api/shop/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save appearance');
      }
      setAdminData(prev => prev ? {
        ...prev,
        shop: prev.shop ? { ...prev.shop, ...next } : prev.shop,
      } : prev);
      setColorSaved(true);
      setTimeout(() => setColorSaved(false), 2500);
    } catch (err: any) {
      setColorError(err.message || 'Failed to save appearance');
    } finally {
      setIsSavingColor(false);
    }
  };

  const handleSaveAppearance = () => saveAppearance({ brandColor, bgColor, textColor });

  const handleResetAppearance = () => {
    setBrandColor(DEFAULT_BRAND_HEX);
    setBgColor(DEFAULT_BG_HEX);
    setTextColor('dark');
    saveAppearance({ brandColor: DEFAULT_BRAND_HEX, bgColor: DEFAULT_BG_HEX, textColor: 'dark' });
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  };

  // Per-row +1 stamp (no cooldown, admin action).
  const handleRowStamp = async (customer: Customer) => {
    setOpenMenuId(null);
    setRowStampingId(customer.id);
    try {
      const res = await fetch('/api/manual-stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: customer.phoneNumber, shopId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add stamp');
      showToast(
        data.rewardActive
          ? 'Free coffee earned! 🎉 Cycle reset'
          : `Stamp added · ${data.stampCount}/10`,
      );
      await fetchAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add stamp');
    } finally {
      setRowStampingId(null);
    }
  };

  const copyNumber = (phone: string) => {
    navigator.clipboard?.writeText(formatPhoneNumber(phone)).catch(() => {});
    setOpenMenuId(null);
    showToast('Number copied');
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
  // Drawer reads live from the list by id, so it reflects fresh data after a stamp.
  const drawerCustomer = drawerId ? allCustomers.find((c) => c.id === drawerId) ?? null : null;
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
          <section className="bg-[#fbf3e7] border border-stone-700/10 rounded-xl">
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
                {(() => {
                  const sortItems: { value: typeof sortBy; label: string; icon: JSX.Element }[] = [
                    { value: 'recent',  label: 'Most recent',  icon: (<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>) },
                    { value: 'stamps',  label: 'Most stamps',  icon: (<><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></>) },
                    { value: 'scans',   label: 'Most scans',   icon: (<><path d="M2 8V6a2 2 0 0 1 2-2h2M22 8V6a2 2 0 0 0-2-2h-2M2 16v2a2 2 0 0 0 2 2h2M22 16v2a2 2 0 0 1-2 2h-2"/><path d="M2 12h20"/></>) },
                    { value: 'rewards', label: 'Most rewards', icon: (<><path d="M3 8h14a3 3 0 0 1 0 6h-1"/><path d="M3 8v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8"/><path d="M7 4v2M11 4v2M15 4v2"/></>) },
                  ];
                  const current = sortItems.find((s) => s.value === sortBy)!;
                  return (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSortOpen((o) => !o)}
                        aria-haspopup="listbox"
                        aria-expanded={sortOpen}
                        className="inline-flex items-center gap-2 h-[38px] pl-3 pr-2.5 text-sm bg-white border border-stone-700/15 rounded-lg text-stone-700 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-stone-400">
                          <path d="M3 6h13M3 12h9M3 18h5M17 8l3-3 3 3M20 5v14"/>
                        </svg>
                        <span className="font-medium">{current.label}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3.5 h-3.5 text-stone-400 transition-transform ${sortOpen ? 'rotate-180' : ''}`}>
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </button>
                      {sortOpen && <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />}
                          <div
                            role="listbox"
                            className={`absolute right-0 mt-1.5 z-20 w-52 origin-top-right rounded-xl bg-white border border-stone-700/12 shadow-xl shadow-stone-900/10 p-1 transition-all duration-150 ease-out ${sortOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}`}
                          >
                            {sortItems.map((item) => {
                              const active = item.value === sortBy;
                              return (
                                <button
                                  key={item.value}
                                  type="button"
                                  role="option"
                                  aria-selected={active}
                                  onClick={() => { setSortBy(item.value); setSortOpen(false); }}
                                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition-colors duration-100 ${
                                    active
                                      ? 'bg-[#ece2d2] text-stone-900 font-semibold hover:bg-[#e5dbc9]'
                                      : 'text-stone-700 hover:bg-[#f2eadd]'
                                  }`}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`w-4 h-4 ${active ? 'text-stone-700' : 'text-stone-400'}`}>
                                    {item.icon}
                                  </svg>
                                  <span className="flex-1">{item.label}</span>
                                  {active && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="w-4 h-4 text-stone-800">
                                      <path d="M20 6 9 17l-5-5"/>
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                    </div>
                  );
                })()}
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
            <div>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="sticky top-14 z-20 bg-[#f0e2cc] shadow-[inset_0_-1px_0_rgba(80,52,28,0.15)] px-5 sm:px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Phone</th>
                    <th className="sticky top-14 z-20 bg-[#f0e2cc] shadow-[inset_0_-1px_0_rgba(80,52,28,0.15)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Stamps</th>
                    <th className="sticky top-14 z-20 bg-[#f0e2cc] shadow-[inset_0_-1px_0_rgba(80,52,28,0.15)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Scans</th>
                    <th className="sticky top-14 z-20 bg-[#f0e2cc] shadow-[inset_0_-1px_0_rgba(80,52,28,0.15)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Rewards</th>
                    <th className="sticky top-14 z-20 bg-[#f0e2cc] shadow-[inset_0_-1px_0_rgba(80,52,28,0.15)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Status</th>
                    <th className="sticky top-14 z-20 bg-[#f0e2cc] shadow-[inset_0_-1px_0_rgba(80,52,28,0.15)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500">Last visit</th>
                    <th className="sticky top-14 z-20 bg-[#f0e2cc] shadow-[inset_0_-1px_0_rgba(80,52,28,0.15)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500 text-right pr-5 sm:pr-6"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {allCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-14 text-center text-stone-500">
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
                      <td colSpan={7} className="px-6 py-14 text-center text-stone-500">
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
                      // Segmented stamp meter — FIXED amber/orange (not the shop's
                      // brand color, which could be white/invisible). Reflects proximity.
                      const pipHex =
                        customer.stampCount >= 8 ? '#ea580c'   // 8-9: almost there
                        : customer.stampCount >= 4 ? '#f59e0b' // 4-7: building up
                        : '#fbbf24';                           // 0-3: just starting
                      const countHex =
                        customer.stampCount >= 8 ? '#c2410c'
                        : customer.stampCount >= 4 ? '#b45309'
                        : '#7c6043';
                      const seg = SEGMENT_META[customerSegment(customer)];
                      const isReady = customer.rewardActive;
                      const stamping = rowStampingId === customer.id;

                      return (
                      <tr
                        key={customer.id}
                        onClick={() => setDrawerId(customer.id)}
                        className="group border-b border-stone-700/5 last:border-b-0 hover:bg-stone-700/[0.03] transition-colors cursor-pointer"
                      >
                        <td className="px-5 sm:px-6 py-3.5 text-sm font-mono text-stone-900 tabular-nums whitespace-nowrap">
                          {formatPhoneNumber(customer.phoneNumber)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex gap-[3px]" aria-label={`${customer.stampCount} of 10 stamps`}>
                              {Array.from({ length: 10 }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`w-2 h-4 rounded-[3px] transition-colors ${i < customer.stampCount ? '' : 'bg-stone-700/15'}`}
                                  style={i < customer.stampCount ? { backgroundColor: pipHex } : undefined}
                                />
                              ))}
                            </div>
                            <span
                              className={`text-xs tabular-nums ${customer.stampCount >= 8 ? 'font-semibold' : ''}`}
                              style={{ color: countHex }}
                            >{customer.stampCount}/10</span>
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
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium border px-2 py-0.5 rounded-full ${seg.cls}`}>
                            {isReady && (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                              </span>
                            )}
                            {seg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-stone-500 whitespace-nowrap">
                          {customer.lastScannedAt
                            ? new Date(customer.lastScannedAt).toLocaleDateString('en-EG', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3.5 pr-5 sm:pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className={`flex items-center justify-end gap-1.5 transition-opacity ${openMenuId === customer.id ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100'}`}>
                            <button
                              onClick={() => handleRowStamp(customer)}
                              disabled={stamping}
                              className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-semibold text-amber-800 bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/25 transition disabled:opacity-50"
                            >
                              {stamping ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 animate-spin"><path d="M21 12a9 9 0 1 1-3-6.7"/></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14"/></svg>
                              )}
                              Stamp
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === customer.id ? null : customer.id)}
                                aria-label="More actions"
                                className="w-8 h-8 rounded-lg border border-stone-700/12 bg-white/60 hover:bg-white text-stone-500 hover:text-stone-800 grid place-items-center transition"
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>
                              </button>
                              {openMenuId === customer.id && <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />}
                                  <div className={`absolute right-0 mt-1.5 z-20 w-44 origin-top-right rounded-xl bg-white border border-stone-700/12 shadow-xl shadow-stone-900/10 p-1 transition-all duration-150 ease-out ${openMenuId === customer.id ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}`}>
                                    <button onClick={() => handleRowStamp(customer)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-stone-700 hover:bg-[#f2eadd] transition-colors text-left">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-amber-700"><path d="M12 5v14M5 12h14"/></svg>
                                      Add stamp
                                    </button>
                                    <button onClick={() => { setDrawerId(customer.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-stone-700 hover:bg-[#f2eadd] transition-colors text-left">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-stone-400"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                      View details
                                    </button>
                                    <button onClick={() => copyNumber(customer.phoneNumber)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-stone-700 hover:bg-[#f2eadd] transition-colors text-left">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-stone-400"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
                                      Copy number
                                    </button>
                                  </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Brand color — settings */}
          <section className="bg-transparent border-t border-stone-700/10 pt-6 mt-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100/60 border border-amber-200/70 text-amber-700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                  <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="11.5" r="2.5"/><circle cx="17.5" cy="12.5" r="2.5"/><path d="M12 22a10 10 0 1 1 0-20c4 0 6 2 6 4 0 3-4 2-4 5s3 2 3 5-2 6-5 6Z"/>
                </svg>
              </span>
              <h2 className="text-[17px] font-semibold tracking-tight text-stone-900">Appearance</h2>
            </div>
            <p className="text-sm text-stone-500 mt-1.5 mb-5 ml-9">
              How your customer pages look — scan page, live QR display, reward screen.
            </p>

            <div className="grid lg:grid-cols-[1fr,240px] gap-6 items-start">
              {/* Controls */}
              <div className="space-y-5">
                {/* Accent */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Accent color</label>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <label className="relative w-10 h-10 rounded-lg border border-stone-700/15 overflow-hidden shrink-0 cursor-pointer shadow-inner" style={{ backgroundColor: isValidHex(brandColor) ? brandColor : '#ccc' }}>
                      <input type="color" value={isValidHex(brandColor) ? brandColor : DEFAULT_BRAND_HEX} onChange={(e) => { setBrandColor(e.target.value); setColorSaved(false); setColorError(''); }} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Pick accent color" />
                    </label>
                    <input type="text" value={brandColor} onChange={(e) => { setBrandColor(e.target.value); setColorSaved(false); setColorError(''); }} placeholder="#f59e0b" spellCheck={false} className="w-28 px-3 py-2 text-sm bg-white border border-stone-700/15 rounded-lg font-mono text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition" />
                    <div className="flex items-center gap-1.5">
                      {['#f59e0b', '#d97706', '#0ea5e9', '#10b981', '#e11d48', '#7c3aed', '#ffffff'].map((c) => (
                        <button key={c} onClick={() => { setBrandColor(c); setColorSaved(false); setColorError(''); }} className={`w-6 h-6 rounded-full border shadow-inner transition hover:scale-110 ${brandColor.toLowerCase() === c ? 'border-stone-900 ring-2 ring-offset-1 ring-stone-400' : 'border-stone-700/20'}`} style={{ backgroundColor: c }} aria-label={`Use ${c}`} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Background */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Background color</label>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <label className="relative w-10 h-10 rounded-lg border border-stone-700/15 overflow-hidden shrink-0 cursor-pointer shadow-inner" style={{ backgroundColor: isValidHex(bgColor) ? bgColor : '#ccc' }}>
                      <input type="color" value={isValidHex(bgColor) ? bgColor : DEFAULT_BG_HEX} onChange={(e) => { setBgColor(e.target.value); setColorSaved(false); setColorError(''); }} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Pick background color" />
                    </label>
                    <input type="text" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setColorSaved(false); setColorError(''); }} placeholder="#e7d3b8" spellCheck={false} className="w-28 px-3 py-2 text-sm bg-white border border-stone-700/15 rounded-lg font-mono text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition" />
                    <div className="flex items-center gap-1.5">
                      {['#e7d3b8', '#ffffff', '#f5f5f4', '#1c1410', '#0b1220', '#14322b'].map((c) => (
                        <button key={c} onClick={() => { setBgColor(c); setColorSaved(false); setColorError(''); }} className={`w-6 h-6 rounded-full border shadow-inner transition hover:scale-110 ${bgColor.toLowerCase() === c ? 'border-stone-900 ring-2 ring-offset-1 ring-stone-400' : 'border-stone-700/20'}`} style={{ backgroundColor: c }} aria-label={`Use ${c}`} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Text color */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500">Text on background</label>
                  <div className="inline-flex mt-2 p-1 rounded-lg bg-stone-700/[0.06] border border-stone-700/12">
                    {(['dark', 'light'] as TextMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => { setTextColor(mode); setColorSaved(false); setColorError(''); }}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition ${textColor === mode ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-stone-700/25" style={{ background: INK_FOR[mode] }} />
                        {mode === 'dark' ? 'Dark' : 'Light'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save / reset */}
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={handleSaveAppearance} disabled={isSavingColor || !isValidHex(brandColor) || !isValidHex(bgColor)} className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-900 transition disabled:opacity-40 disabled:cursor-not-allowed">
                    {isSavingColor ? 'Saving…' : 'Save appearance'}
                  </button>
                  <button onClick={handleResetAppearance} disabled={isSavingColor} className="inline-flex items-center justify-center px-3 py-2 text-sm rounded-lg text-stone-600 hover:bg-stone-700/5 transition disabled:opacity-50">
                    Reset
                  </button>
                  <div className="min-h-[1.25rem] text-sm">
                    {colorError && <span className="text-red-600">{colorError}</span>}
                    {colorSaved && <span className="text-green-700">Saved — customers see this now.</span>}
                  </div>
                </div>
              </div>

              {/* Live preview — a mock of the customer scan page */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Preview</div>
                <div
                  className="rounded-2xl border border-stone-700/12 p-5 flex flex-col items-center gap-3 shadow-inner transition-colors"
                  style={{ background: isValidHex(bgColor) ? bgColor : DEFAULT_BG_HEX }}
                >
                  <div className="text-[11px] font-medium tracking-wide" style={{ color: INK_FOR[textColor], opacity: 0.85 }}>
                    {adminData?.shop?.name || 'Your shop'}
                  </div>
                  {(() => {
                    const card = deriveCardColors(isValidHex(bgColor) ? bgColor : DEFAULT_BG_HEX, textColor);
                    const accent = isValidHex(brandColor) ? brandColor : DEFAULT_BRAND_HEX;
                    return (
                      <div className="w-full max-w-[190px] rounded-xl p-4 flex flex-col items-center gap-3 shadow-lg" style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                        <div className="w-9 h-9 rounded-full shadow-inner" style={{ background: accent }} />
                        <div className="text-sm font-bold" style={{ color: card.ink }}>{adminData?.shop?.name || 'Shop Name'}</div>
                        <div className="grid grid-cols-5 gap-1">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i < 4 ? accent : card.inset }} />
                          ))}
                        </div>
                        <div className="w-full h-7 rounded-lg text-[11px] font-bold flex items-center justify-center" style={{ background: accent, color: '#3a2616' }}>
                          Continue
                        </div>
                      </div>
                    );
                  })()}
                  <div className="text-[10px]" style={{ color: INK_FOR[textColor], opacity: 0.7 }}>powered by Rekur</div>
                </div>
                <p className="text-[11px] text-stone-500 mt-2">Updates live. Save to apply for customers.</p>
              </div>
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

      {/* Customer detail drawer */}
      <div
        className={`fixed inset-0 z-40 bg-[#281908]/35 transition-opacity duration-200 ${drawerCustomer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setDrawerId(null)}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-[min(390px,92vw)] z-50 bg-[#fbf3e7] border-l border-stone-700/12 shadow-[-30px_0_60px_-30px_rgba(80,52,28,0.5)] flex flex-col overflow-y-auto transition-transform duration-300 ${drawerCustomer ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!drawerCustomer}
      >
        {drawerCustomer && (() => {
          const c = drawerCustomer;
          const seg = SEGMENT_META[customerSegment(c)];
          const remaining = 10 - c.stampCount;
          return (
            <>
              <div className="flex items-center gap-3.5 p-5 border-b border-stone-700/12">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/25 grid place-items-center text-amber-700 shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-6 h-6"><path d="M3 8h14a3 3 0 0 1 0 6h-1"/><path d="M3 8v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8"/><path d="M7 3v2M11 3v2M15 3v2"/></svg>
                </div>
                <div className="min-w-0">
                  <div className="font-mono font-semibold text-[17px] text-stone-900">{formatPhoneNumber(c.phoneNumber)}</div>
                  <div className="mt-0.5"><span className={`inline-flex items-center gap-1.5 text-xs font-medium border px-2 py-0.5 rounded-full ${seg.cls}`}>{seg.label}</span></div>
                </div>
                <button onClick={() => setDrawerId(null)} aria-label="Close" className="ml-auto self-start w-8 h-8 rounded-lg border border-stone-700/12 bg-white/60 hover:bg-white text-stone-500 hover:text-stone-800 grid place-items-center transition">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="p-5 grid gap-4">
                {/* Progress ring */}
                <div className="flex items-center gap-4 bg-[#f1e6d3] border border-stone-700/10 rounded-2xl p-4">
                  <div
                    className="w-[84px] h-[84px] rounded-full grid place-items-center shrink-0"
                    style={{ background: `conic-gradient(#f59e0b ${c.stampCount * 10}%, rgba(80,52,28,0.12) 0)` }}
                  >
                    <div className="w-[62px] h-[62px] rounded-full bg-[#f1e6d3] grid place-items-center">
                      <span className="font-mono font-semibold text-stone-900">{c.stampCount}/10</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-stone-900">
                      {c.rewardActive ? 'Reward ready' : c.stampCount >= 8 ? 'Almost there' : 'Current cycle'}
                    </div>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {c.rewardActive || remaining <= 0 ? 'Ready to redeem a free coffee' : `${remaining} stamp${remaining === 1 ? '' : 's'} to a free coffee`}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#f1e6d3] border border-stone-700/10 rounded-xl px-3.5 py-3">
                    <div className="text-[11px] uppercase tracking-wide text-stone-500">Total scans</div>
                    <div className="text-2xl font-semibold tabular-nums text-stone-900 mt-0.5">{c.totalScans}</div>
                  </div>
                  <div className="bg-[#f1e6d3] border border-stone-700/10 rounded-xl px-3.5 py-3">
                    <div className="text-[11px] uppercase tracking-wide text-stone-500">Free coffees</div>
                    <div className="text-2xl font-semibold tabular-nums text-orange-700 mt-0.5">{c.totalRewards}</div>
                  </div>
                  <div className="col-span-2 bg-[#f1e6d3] border border-stone-700/10 rounded-xl px-3.5 py-3">
                    <div className="text-[11px] uppercase tracking-wide text-stone-500">Last visit</div>
                    <div className="text-sm font-medium text-stone-800 mt-1">
                      {c.lastScannedAt
                        ? new Date(c.lastScannedAt).toLocaleString('en-EG', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'No visits yet'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 mt-1">
                  <button
                    onClick={() => handleRowStamp(c)}
                    disabled={rowStampingId === c.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-stone-900 transition disabled:opacity-50"
                  >
                    {rowStampingId === c.id ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 animate-spin"><path d="M21 12a9 9 0 1 1-3-6.7"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="w-4 h-4"><path d="M12 5v14M5 12h14"/></svg>
                    )}
                    Add stamp
                  </button>
                  <button
                    onClick={() => copyNumber(c.phoneNumber)}
                    className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-medium text-stone-700 bg-white border border-stone-700/15 hover:bg-stone-700/[0.04] transition"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
                    Copy
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </aside>

      {/* Toast */}
      <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c1410] text-[#fbf3e7] text-sm font-medium shadow-xl transition-all duration-200 ${toastMsg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4 text-green-400"><path d="M20 6 9 17l-5-5"/></svg>
        {toastMsg}
      </div>
    </div>
  );
}
