import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (body?.logs) {
    console.error('[Apple Wallet]', body.logs);
  }
  return new NextResponse(null, { status: 200 });
}
