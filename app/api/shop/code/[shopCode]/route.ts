import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { shopCode: string } }
) {
  try {
    // brandColor is optional (added by migration 001). Fall back gracefully if
    // the column isn't present yet so the scan flow never breaks.
    let result;
    try {
      result = await query(
        'SELECT id, name, "logoUrl", "brandColor", "bgColor", "textColor" FROM "Shop" WHERE "qrCode" = $1',
        [params.shopCode]
      );
    } catch (e: any) {
      if (e?.code === '42703') {
        result = await query(
          'SELECT id, name, "logoUrl" FROM "Shop" WHERE "qrCode" = $1',
          [params.shopCode]
        );
      } else {
        throw e;
      }
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, shop: result.rows[0] });
  } catch (error) {
    console.error('Error fetching shop by code:', error);
    return NextResponse.json({ error: 'Failed to fetch shop details' }, { status: 500 });
  }
}
