import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
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
    const qrCode = nanoid(12); // 12-character unique ID

    // Create shop
    const shop = await prisma.shop.create({
      data: {
        name: shopName.trim(),
        qrCode,
      },
    });

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
