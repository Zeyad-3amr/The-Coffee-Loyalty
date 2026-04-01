import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getUserIdFromRequest } from '@/app/lib/auth-helpers';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { error: 'Please sign in to create a shop' },
      { status: 401 }
    );
  }

  try {
    const { shopName } = await request.json();

    if (!shopName || shopName.trim() === '') {
      return NextResponse.json({ error: 'Shop name is required' }, { status: 400 });
    }

    const qrCode = nanoid(12);

    const result = await query(
      'INSERT INTO "Shop" (id, name, "qrCode", "userId", "createdAt") VALUES ($1, $2, $3, $4, NOW()) RETURNING id, name, "qrCode"',
      [nanoid(), shopName.trim(), qrCode, userId]
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
    return NextResponse.json({ error: 'Something went wrong, please try again' }, { status: 500 });
  }
}
