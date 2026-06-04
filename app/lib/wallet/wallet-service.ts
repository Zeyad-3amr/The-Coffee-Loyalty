import { query, getClient } from '@/app/lib/db';
import { createWalletPass, updateWalletPass } from './pass-builder';
import type { CreatePassResult, WalletStampResult } from './types';

export async function createPass(
  stampId: string,
  stampCount: number,
  shopName: string,
): Promise<CreatePassResult> {
  const { serialNumber, passFileUrl } = await createWalletPass(stampId, stampCount, shopName);

  await query(
    'UPDATE "Stamp" SET "passSerialNumber" = $1 WHERE id = $2',
    [serialNumber, stampId],
  );

  return { serialNumber, authToken: '', passUrl: passFileUrl };
}

export async function pushPassUpdate(
  serialNumber: string,
  stampId: string,
  stampCount: number,
  shopName: string,
  rewardActive: boolean,
): Promise<void> {
  try {
    await updateWalletPass(serialNumber, stampId, stampCount, shopName, rewardActive);
  } catch (err) {
    console.error('WalletWallet push update failed:', err);
  }
}

export async function addWalletStamp(stampId: string): Promise<WalletStampResult> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const stampResult = await client.query(
      `SELECT s.*, sh.name AS "shopName", sh."walletEnabled"
       FROM "Stamp" s
       JOIN "Shop" sh ON sh.id = s."shopId"
       WHERE s.id = $1`,
      [stampId],
    );

    if (stampResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('Stamp record not found');
    }

    const stamp = stampResult.rows[0];
    const now = new Date();

    // Reset expired reward before incrementing
    if (stamp.rewardActive && stamp.rewardExpiresAt && new Date(stamp.rewardExpiresAt) <= now) {
      stamp.rewardActive = false;
      stamp.stampCount = 0;
    }

    let newStampCount = stamp.stampCount + 1;
    let rewardActive = false;
    let rewardExpiresAt: Date | null = null;

    if (newStampCount >= 10) {
      rewardActive = true;
      rewardExpiresAt = new Date(now.getTime() + 7 * 60 * 1000);
      newStampCount = 0;
    }

    const updated = await client.query(
      `UPDATE "Stamp"
       SET "stampCount" = $1, "lastScannedAt" = $2, "rewardActive" = $3,
           "rewardExpiresAt" = $4, "updatedAt" = NOW(),
           "totalScans" = "totalScans" + 1,
           "totalRewards" = "totalRewards" + ${rewardActive ? 1 : 0}
       WHERE id = $5
       RETURNING "passSerialNumber"`,
      [newStampCount, now, rewardActive, rewardExpiresAt, stampId],
    );

    await client.query('COMMIT');

    const serialNumber = updated.rows[0].passSerialNumber;

    // Push update to installed pass (fire-and-forget)
    if (serialNumber) {
      pushPassUpdate(serialNumber, stampId, newStampCount, stamp.shopName, rewardActive)
        .catch(console.error);
    }

    return { stampCount: newStampCount, rewardActive, rewardExpiresAt };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
