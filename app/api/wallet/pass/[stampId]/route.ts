import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

/**
 * GET /api/wallet/pass/[stampId]
 * Serves a fresh .pkpass file so customers can add/re-add the card to Apple Wallet.
 * Called when the "Add to Apple Wallet" button is tapped.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { stampId: string } },
) {
  const { stampId } = params;

  const result = await query(
    `SELECT s."stampCount", s."rewardActive", sh.name AS "shopName"
     FROM "Stamp" s
     JOIN "Shop" sh ON sh.id = s."shopId"
     WHERE s.id = $1`,
    [stampId],
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { stampCount, rewardActive, shopName } = result.rows[0];

  const key = process.env.WALLETWALLET_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Wallet not configured' }, { status: 503 });
  }

  // Generate a fresh .pkpass via WalletWallet API
  const wwRes = await fetch('https://api.walletwallet.dev/api/pkpass', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
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
        { key: 'shop', label: 'SHOP', value: shopName },
      ],
    }),
  });

  if (!wwRes.ok) {
    const err = await wwRes.text();
    console.error('WalletWallet pass generation failed:', err);
    return NextResponse.json({ error: 'Pass generation failed' }, { status: 502 });
  }

  // Update the serial number in DB with the freshly generated one
  const newSerial = wwRes.headers.get('X-Serial-Number');
  if (newSerial) {
    query(
      'UPDATE "Stamp" SET "passSerialNumber" = $1 WHERE id = $2',
      [newSerial, stampId],
    ).catch(console.error);
  }

  // Stream the binary .pkpass back to the iPhone
  const passBuffer = await wwRes.arrayBuffer();

  return new NextResponse(passBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="loyalty.pkpass"`,
    },
  });
}
