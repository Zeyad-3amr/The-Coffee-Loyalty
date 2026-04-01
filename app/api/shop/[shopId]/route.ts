import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const { logoUrl } = await request.json();

    await query(
      'UPDATE "Shop" SET "logoUrl" = $1 WHERE id = $2',
      [logoUrl || null, params.shopId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating shop logo:', error);
    return NextResponse.json({ error: 'Failed to update logo' }, { status: 500 });
  }
}
