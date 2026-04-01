import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getUserIdFromRequest } from '@/app/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await query(
      'SELECT id, name, "qrCode", "createdAt" FROM "Shop" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId]
    );
    return NextResponse.json({ success: true, shops: result.rows });
  } catch (error) {
    console.error('Error in /api/my-shops:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
