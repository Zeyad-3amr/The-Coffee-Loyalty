import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const { shopId } = params;
    
    // Fetch shop details for signing
    const shopResult = await query(
      'SELECT "qrCode" FROM "Shop" WHERE id = $1',
      [shopId]
    );

    if (shopResult.rows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shopCode = shopResult.rows[0].qrCode;
    const t = Date.now().toString();
    const secret = process.env.JWT_SECRET || 'rekur-digital-qr-secret-key-2026';
    
    // Create signature using Token timestamp + shop code
    const s = crypto.createHmac('sha256', secret).update(t + shopCode).digest('hex');

    return NextResponse.json({ success: true, t, s, shopCode });
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
