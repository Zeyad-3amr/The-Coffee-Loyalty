import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

type Params = { deviceId: string; passType: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  const { deviceId } = params;
  const passesUpdatedSince = request.nextUrl.searchParams.get('passesUpdatedSince');

  const result = await query(
    `SELECT d."passSerial", s."updatedAt"
     FROM "PassDevice" d
     JOIN "Stamp" s ON s."passSerialNumber" = d."passSerial"
     WHERE d."deviceLibraryId" = $1
     ${passesUpdatedSince ? 'AND s."updatedAt" > $2' : ''}`,
    passesUpdatedSince ? [deviceId, new Date(passesUpdatedSince)] : [deviceId],
  );

  if (result.rows.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const serials = result.rows.map((r: { passSerial: string }) => r.passSerial);
  const lastUpdated = result.rows
    .map((r: { updatedAt: Date }) => new Date(r.updatedAt))
    .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0]
    .toISOString();

  return NextResponse.json({ serialNumbers: serials, lastUpdated });
}
