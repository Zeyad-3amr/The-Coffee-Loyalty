import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const { shopName } = await request.json();

    if (!shopName || shopName.trim() === '') {
      return NextResponse.json(
        { error: 'Shop name is required' },
        { status: 400 }
      );
    }

    // Generate unique QR code
    const qrCode = nanoid(12);

    // Create shop
    const result = await query(
      'INSERT INTO "Shop" (id, name, "qrCode", "createdAt") VALUES ($1, $2, $3, NOW()) RETURNING id, name, "qrCode"',
      [nanoid(), shopName.trim(), qrCode]
    );

    const shop = result.rows[0];

    return NextResponse.json({
      success: true,
      shopId: shop.id,
      qrCode: shop.qrCode,
      shopName: shop.name,
    });
  } catch (error) {
    console.error('Error in /api/setup:', error);
    return NextResponse.json(
      { error: 'Something went wrong, please try again' },
      { status: 500 }
    );
  }
}
