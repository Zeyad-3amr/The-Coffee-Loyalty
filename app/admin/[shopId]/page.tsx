'use client';

import { useEffect, useState } from 'react';
import { validateEgyptPhoneNumber, formatPhoneNumber } from '@/app/lib/utils';
import { ErrorDisplay } from '@/app/components/ErrorDisplay';
import { Sidebar } from '@/app/components/Sidebar';

interface AdminPageProps {
  params: {
    shopId: string;
  };
}

interface Customer {
  id: string;
  phoneNumber: string;
  stampCount: number;
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
  };
  customers?: Customer[];
  totals?: {
    totalCustomers: number;
    totalStampsGiven: number;
    totalRewardsRedeemed: number;
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

  if (pageState === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">☕</div>
          <p className="text-stone-400 text-lg font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return <ErrorDisplay error={error} onRetry={fetchAdminData} />;
  }

  if (!adminData) {
    return null;
  }

  return (
    <div className="flex flex-1 w-full bg-stone-950 relative">
      <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Sidebar */}
      <Sidebar shopId={shopId} shopName={adminData?.shop?.name} />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-10 pb-8 border-b border-white/5">
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-100 to-stone-400 mb-2 tracking-tight">
                {adminData?.shop?.name}
              </h1>
              <div className="flex items-center gap-3">
                <span className="bg-stone-900 border border-white/10 px-3 py-1 rounded-full text-xs font-mono text-amber-500 tracking-wider">
                  ID: {adminData?.shop?.id}
                </span>
              </div>
            </div>
            <a
              href={`/print-qr/${shopId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-stone-900 hover:bg-stone-800 text-stone-300 font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center border border-white/10 hover:border-amber-500/30 shadow-lg"
            >
              Print QR Poster
            </a>
        </div>

        <div className="space-y-10 animate-fadeUp">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card-hover p-8 relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 to-amber-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="text-stone-400 text-sm font-bold uppercase tracking-widest mb-4">Total Customers</div>
              <div className="text-5xl font-black text-white drop-shadow-md">
                {adminData?.totals?.totalCustomers ?? 0}
              </div>
            </div>
            <div className="glass-card-hover p-8 relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-stone-600 to-stone-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="text-stone-400 text-sm font-bold uppercase tracking-widest mb-4">Total Stamps</div>
              <div className="text-5xl font-black text-white drop-shadow-md">
                {adminData?.totals?.totalStampsGiven ?? 0}
              </div>
            </div>
            <div className="glass-card-hover p-8 relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-600 to-green-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="text-stone-400 text-sm font-bold uppercase tracking-widest mb-4">Active Rewards</div>
              <div className="text-5xl font-black text-white drop-shadow-md">
                {adminData?.totals?.totalRewardsRedeemed ?? 0}
              </div>
            </div>
          </div>

          {/* Manual Stamp Section */}
          <div className="glass-card p-8 bg-gradient-to-br from-stone-900/50 to-stone-900/10">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold text-stone-100 mb-2">Add Stamp Manually</h2>
              <p className="text-stone-400 mb-6">
                Use this dashboard feature to add a stamp if the customer cannot scan the QR code.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="tel"
                  value={manualPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setManualPhone(value);
                    setManualError('');
                  }}
                  placeholder="e.g. 01012345678"
                  maxLength={11}
                  className={`flex-1 px-5 py-3.5 bg-stone-950 border rounded-xl font-mono text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 shadow-inner transition ${
                    manualError
                      ? 'border-red-500/50 focus:ring-red-500/50'
                      : 'border-white/10 focus:ring-amber-500/50 focus:border-amber-500/50'
                  }`}
                />
                <button
                  onClick={handleAddManualStamp}
                  disabled={manualPhone.length !== 11 || isAddingStamp}
                  className="btn-amber px-8 py-3.5 rounded-xl whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isAddingStamp ? 'Processing...' : 'Add Stamp'}
                </button>
              </div>
              {manualError && <p className="text-red-400 text-sm mt-3 font-medium">{manualError}</p>}
            </div>
          </div>

          {/* Customers List */}
          <div className="glass-card overflow-hidden">
            <div className="px-8 py-6 bg-stone-900/40 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-100">Customer Roster</h2>
              <span className="text-stone-500 text-sm font-semibold">{adminData?.customers?.length || 0} Total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-950/40 border-b border-white/5">
                    <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">
                      Phone Number
                    </th>
                    <th className="px-8 py-4 text-center text-xs font-bold uppercase tracking-wider text-stone-400">
                      Progress
                    </th>
                    <th className="px-8 py-4 text-center text-xs font-bold uppercase tracking-wider text-stone-400">
                      Reward Status
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-stone-400">
                      Last Visit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-stone-900/10">
                  {!adminData?.customers || adminData.customers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center text-stone-500">
                        <div className="text-4xl mb-3 opacity-50">👥</div>
                        <p>No customers have scanned yet.</p>
                      </td>
                    </tr>
                  ) : (
                    adminData.customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-stone-800/20 transition-colors">
                        <td className="px-8 py-5 text-sm font-mono text-stone-300">
                          {formatPhoneNumber(customer.phoneNumber)}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="inline-flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider">
                            {customer.stampCount} / 10
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          {customer.rewardActive ? (
                            <span className="inline-flex items-center justify-center bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider relative">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="text-stone-600 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-stone-400">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
