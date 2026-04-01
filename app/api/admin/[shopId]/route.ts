import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const { shopId } = params;

    // Find shop
    const shopResult = await query(
      'SELECT id, name, "qrCode", "logoUrl" FROM "Shop" WHERE id = $1',
      [shopId]
    );

    if (shopResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    const shop = shopResult.rows[0];

    // Get stamps with customer info
    const stampsResult = await query(
      `SELECT s.*, c."phoneNumber" FROM "Stamp" s
       JOIN "Customer" c ON s."customerId" = c.id
       WHERE s."shopId" = $1
       ORDER BY s."updatedAt" DESC`,
      [shopId]
    );

    const stamps = stampsResult.rows;
    const totalCustomers = stamps.length;
    const totalStampsGiven = stamps.reduce((sum: number, s: any) => sum + s.stampCount, 0);
    const totalRewardsRedeemed = stamps.filter((s: any) => s.rewardActive).length;

    return NextResponse.json({
      success: true,
      shop,
      customers: stamps.map((s: any) => ({
        id: s.customerId,
        phoneNumber: s.phoneNumber,
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
