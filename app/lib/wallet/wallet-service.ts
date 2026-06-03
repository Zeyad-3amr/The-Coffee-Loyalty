import { nanoid } from 'nanoid';
import { query } from '@/app/lib/db';
import { buildPass } from './pass-builder';
import { sendPassUpdatePush } from './apns';
import type { CreatePassResult, WalletStampResult } from './types';

function passUrl(serialNumber: string): string {
  const base = process.env.PASS_WEB_SERVICE_URL;
  const passType = process.env.PASS_TYPE_IDENTIFIER;
  return `${base}/v1/passes/${passType}/${serialNumber}`;
}

export async function createPass(
  stampId: string,
  stampCount: number,
  shopName: string,
): Promise<CreatePassResult> {
  const serialNumber = nanoid();
  const authToken = nanoid(32);

  await buildPass({ stampId, serialNumber, authToken, stampCount, shopName });

  await query(
    'UPDATE "Stamp" SET "passSerialNumber" = $1, "passAuthToken" = $2 WHERE id = $3',
    [serialNumber, authToken, stampId],
  );

  return { serialNumber, authToken, passUrl: passUrl(serialNumber) };
}

export async function pushPassUpdate(serialNumber: string): Promise<void> {
  const result = await query(
    'SELECT "pushToken" FROM "PassDevice" WHERE "passSerial" = $1',
    [serialNumber],
  );

  const tokens = result.rows.map((r: { pushToken: string }) => r.pushToken);
  if (tokens.length > 0) {
    await sendPassUpdatePush(tokens);
  }
}

export async function getPassBuffer(
  serialNumber: string,
  authToken: string,
): Promise<Buffer | null> {
  const result = await query(
    `SELECT s.id, s."stampCount", sh.name AS "shopName"
     FROM "Stamp" s
     JOIN "Shop" sh ON sh.id = s."shopId"
     WHERE s."passSerialNumber" = $1 AND s."passAuthToken" = $2`,
    [serialNumber, authToken],
  );

  if (result.rows.length === 0) return null;

  const { id: stampId, stampCount, shopName } = result.rows[0];
  return buildPass({ stampId, serialNumber, authToken, stampCount, shopName });
}

export async function addWalletStamp(stampId: string): Promise<WalletStampResult> {
  const stampResult = await query(
    `SELECT s.*, sh.name AS "shopName", sh."walletEnabled"
     FROM "Stamp" s
     JOIN "Shop" sh ON sh.id = s."shopId"
     WHERE s.id = $1`,
    [stampId],
  );

  if (stampResult.rows.length === 0) {
    throw new Error('Stamp record not found');
  }

  const stamp = stampResult.rows[0];
  const now = new Date();

  let newStampCount = stamp.stampCount + 1;
  let rewardActive = false;
  let rewardExpiresAt: Date | null = null;

  if (newStampCount >= 10) {
    rewardActive = true;
    rewardExpiresAt = new Date(now.getTime() + 7 * 60 * 1000);
    newStampCount = 0;
  }

  const updated = await query(
    `UPDATE "Stamp"
     SET "stampCount" = $1, "lastScannedAt" = $2, "rewardActive" = $3,
         "rewardExpiresAt" = $4, "updatedAt" = NOW(),
         "totalScans" = "totalScans" + 1,
         "totalRewards" = "totalRewards" + ${rewardActive ? 1 : 0}
     WHERE id = $5
     RETURNING "passSerialNumber"`,
    [newStampCount, now, rewardActive, rewardExpiresAt, stampId],
  );

  const serialNumber = updated.rows[0].passSerialNumber;

  if (serialNumber) {
    await pushPassUpdate(serialNumber);
  }

  return { stampCount: newStampCount, rewardActive, rewardExpiresAt };
}
