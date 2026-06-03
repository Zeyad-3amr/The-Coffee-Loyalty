import { NextRequest, NextResponse } from 'next/server';
import { addWalletStamp } from '@/app/lib/wallet/wallet-service';

export async function POST(request: NextRequest) {
  const { stampId } = await request.json();

  if (!stampId) {
    return NextResponse.json({ error: 'stampId is required' }, { status: 400 });
  }

  try {
    const result = await addWalletStamp(stampId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (error.message === 'Stamp record not found') {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 });
    }
    console.error('Error in /api/wallet-stamp:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
