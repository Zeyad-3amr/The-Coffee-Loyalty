/**
 * WalletWallet API — replaces passkit-generator (which required Apple certs).
 * Docs: https://www.walletwallet.dev/docs/
 * Free tier: 1,000 passes/month, no Apple Developer account needed.
 */

const BASE_URL = 'https://api.walletwallet.dev';

function apiKey(): string {
  const key = process.env.WALLETWALLET_API_KEY;
  if (!key) throw new Error('Missing WALLETWALLET_API_KEY env var');
  return key;
}

function passBody(stampId: string, stampCount: number, shopName: string, rewardActive: boolean) {
  return {
    barcodeValue: stampId,
    barcodeFormat: 'QR',
    logoText: shopName,
    organizationName: shopName,
    description: `${shopName} Loyalty Card`,
    foregroundColor: 'rgb(58, 38, 22)',
    backgroundColor: 'rgb(231, 211, 184)',
    labelColor: 'rgb(124, 96, 67)',
    headerFields: [
      {
        key: 'stamps',
        label: 'STAMPS',
        value: rewardActive ? '🎉 Free Coffee!' : `${stampCount} / 10`,
      },
    ],
    primaryFields: [
      {
        key: 'reward',
        label: rewardActive ? 'REWARD READY' : 'COLLECT 10 STAMPS',
        value: rewardActive ? 'Show to cashier' : 'Free coffee awaits',
      },
    ],
    auxiliaryFields: [
      {
        key: 'shop',
        label: 'SHOP',
        value: shopName,
      },
    ],
  };
}

/**
 * Create a new pass via WalletWallet API.
 * Returns { serialNumber, passFileUrl } where passFileUrl is the .pkpass download link.
 */
export async function createWalletPass(
  stampId: string,
  stampCount: number,
  shopName: string,
): Promise<{ serialNumber: string; passFileUrl: string }> {
  const res = await fetch(`${BASE_URL}/api/pkpass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(passBody(stampId, stampCount, shopName, false)),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WalletWallet create failed: ${res.status} ${err}`);
  }

  const serialNumber = res.headers.get('X-Serial-Number') ?? '';
  if (!serialNumber) throw new Error('WalletWallet did not return X-Serial-Number');

  // passFileUrl is set by the caller using the stampId-based route
  const passFileUrl = '';

  return { serialNumber, passFileUrl };
}

/**
 * Update an existing pass via WalletWallet API (triggers APNs push automatically).
 */
export async function updateWalletPass(
  serialNumber: string,
  stampId: string,
  stampCount: number,
  shopName: string,
  rewardActive: boolean,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/pkpass/${serialNumber}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(passBody(stampId, stampCount, shopName, rewardActive)),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WalletWallet update failed: ${res.status} ${err}`);
  }
}
