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
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">☕</div>
          <p className="text-zinc-400">Loading shop data...</p>
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
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <Sidebar shopId={shopId} shopName={adminData?.shop?.name} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100 mb-1">
                {adminData?.shop?.name}
              </h1>
              <p className="text-zinc-400 text-sm">Shop ID: {adminData?.shop?.id}</p>
            </div>
            <a
              href={`/print-qr/${shopId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Print QR Code
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <div className="text-zinc-400 text-sm font-medium mb-2">Total Customers</div>
            <div className="text-4xl font-bold text-zinc-100">
              {adminData?.totals?.totalCustomers ?? 0}
            </div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <div className="text-zinc-400 text-sm font-medium mb-2">Total Stamps Given</div>
            <div className="text-4xl font-bold text-zinc-100">
              {adminData?.totals?.totalStampsGiven ?? 0}
            </div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <div className="text-zinc-400 text-sm font-medium mb-2">Active Rewards</div>
            <div className="text-4xl font-bold text-zinc-100">
              {adminData?.totals?.totalRewardsRedeemed ?? 0}
            </div>
          </div>
        </div>

        {/* Manual Stamp Section */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">Add Stamp Manually</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Use this if the customer's phone doesn't work
          </p>
          <div className="flex gap-3">
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
              className={`flex-1 px-4 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 ${
                manualError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-zinc-700 focus:ring-amber-600'
              }`}
            />
            <button
              onClick={handleAddManualStamp}
              disabled={manualPhone.length !== 11 || isAddingStamp}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-medium px-6 py-2 rounded-lg transition"
            >
              {isAddingStamp ? 'Adding...' : 'Add'}
            </button>
          </div>
          {manualError && <p className="text-red-600 text-sm mt-2">{manualError}</p>}
        </div>

        {/* Customers List */}
        <div className="overflow-hidden border border-zinc-800 rounded-lg">
          <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-100">Customers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-100">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-zinc-100">
                    Stamps
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-zinc-100">
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-100">
                    Last Scan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!adminData?.customers || adminData.customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                      No customers yet
                    </td>
                  </tr>
                ) : (
                  adminData.customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-zinc-900">
                      <td className="px-6 py-4 text-sm font-mono text-zinc-100">
                        {formatPhoneNumber(customer.phoneNumber)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full text-sm font-medium">
                          {customer.stampCount}/10
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {customer.rewardActive ? (
                          <span className="inline-block bg-green-500/10 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
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
