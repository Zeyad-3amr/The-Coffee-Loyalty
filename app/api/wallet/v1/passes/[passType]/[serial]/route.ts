import { NextRequest, NextResponse } from 'next/server';
import { getPassBuffer } from '@/app/lib/wallet/wallet-service';

type Params = { passType: string; serial: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  const { serial } = params;

  const auth = request.headers.get('authorization');
  const authToken = auth?.replace('ApplePass ', '');
  if (!authToken) return new NextResponse(null, { status: 401 });

  const buffer = await getPassBuffer(serial, authToken);
  if (!buffer) return new NextResponse(null, { status: 401 });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="loyalty.pkpass"`,
    },
  });
}
