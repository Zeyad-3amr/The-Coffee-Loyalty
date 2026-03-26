import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const { shopId } = params;

    // Find shop
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get all stamps for this shop with customer info
    const stamps = await prisma.stamp.findMany({
      where: { shopId },
      include: {
        customer: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate totals
    const totalCustomers = stamps.length;
    const totalStampsGiven = stamps.reduce((sum: number, s: any) => sum + s.stampCount, 0);
    const totalRewardsRedeemed = stamps.filter((s: any) => s.rewardActive).length;

    return NextResponse.json({
      success: true,
      shop: {
        id: shop.id,
        name: shop.name,
        qrCode: shop.qrCode,
      },
      customers: stamps.map((s: any) => ({
        id: s.customer.id,
        phoneNumber: s.customer.phoneNumber,
        stampCount: s.stampCount,
        rewardActive: s.rewardActive,
        rewardExpiresAt: s.rewardExpiresAt,
        lastScannedAt: s.lastScannedAt,
      })),
      totals: {
        totalCustomers,
        totalStampsGiven,
        totalRewardsRedeemed,
      },
    });
  } catch (error) {
    console.error('Error in /api/admin/[shopId]:', error);
    return NextResponse.json(
      { error: 'Something went wrong, please try again' },
      { status: 500 }
    );
  }
}
