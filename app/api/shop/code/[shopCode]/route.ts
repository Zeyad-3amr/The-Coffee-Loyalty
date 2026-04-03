import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { shopCode: string } }
) {
  try {
    const result = await query(
      'SELECT id, name, "logoUrl" FROM "Shop" WHERE "qrCode" = $1',
      [params.shopCode]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, shop: result.rows[0] });
  } catch (error) {
    console.error('Error fetching shop by code:', error);
    return NextResponse.json({ error: 'Failed to fetch shop details' }, { status: 500 });
  }
}
