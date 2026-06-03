import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { nanoid } from 'nanoid';

type Params = { deviceId: string; passType: string; serial: string };

function verifyAuthToken(request: NextRequest, expectedToken: string): boolean {
  const auth = request.headers.get('authorization');
  return auth === `ApplePass ${expectedToken}`;
}

async function getStampAuthToken(serial: string): Promise<string | null> {
  const result = await query(
    'SELECT "passAuthToken" FROM "Stamp" WHERE "passSerialNumber" = $1',
    [serial],
  );
  return result.rows[0]?.passAuthToken ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params },
) {
  const { deviceId, serial } = params;

  const authToken = await getStampAuthToken(serial);
  if (!authToken || !verifyAuthToken(request, authToken)) {
    return new NextResponse(null, { status: 401 });
  }

  const { pushToken } = await request.json();
  if (!pushToken) return new NextResponse(null, { status: 400 });

  const existing = await query(
    'SELECT id FROM "PassDevice" WHERE "deviceLibraryId" = $1 AND "passSerial" = $2',
    [deviceId, serial],
  );

  if (existing.rows.length > 0) {
    await query(
      'UPDATE "PassDevice" SET "pushToken" = $1 WHERE "deviceLibraryId" = $2 AND "passSerial" = $3',
      [pushToken, deviceId, serial],
    );
    return new NextResponse(null, { status: 200 });
  }

  await query(
    'INSERT INTO "PassDevice" (id, "deviceLibraryId", "passSerial", "pushToken", "createdAt") VALUES ($1, $2, $3, $4, NOW())',
    [nanoid(), deviceId, serial, pushToken],
  );

  return new NextResponse(null, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params },
) {
  const { deviceId, serial } = params;

  const authToken = await getStampAuthToken(serial);
  if (!authToken || !verifyAuthToken(request, authToken)) {
    return new NextResponse(null, { status: 401 });
  }

  await query(
    'DELETE FROM "PassDevice" WHERE "deviceLibraryId" = $1 AND "passSerial" = $2',
    [deviceId, serial],
  );

  return new NextResponse(null, { status: 200 });
}
