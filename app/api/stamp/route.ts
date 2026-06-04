import { NextRequest, NextResponse } from 'next/server';
import { query, getClient } from '@/app/lib/db';
import { nanoid } from 'nanoid';
import { createPass, pushPassUpdate } from '@/app/lib/wallet/wallet-service';

import crypto from 'crypto';

// Egypt phone validation
function validateEgyptPhoneNumber(phone: string): boolean {
  const phoneRegex = /^01[0-9]{9}$/;
  return phoneRegex.test(phone);
}

export async function POST(request: NextRequest) {
  const client = await getClient();

  try {
    const { phoneNumber, shopCode, t, s } = await request.json();

    if (!phoneNumber || !shopCode || !t || !s) {
      return NextResponse.json(
        { error: 'Invalid scanner link. Please scan the digital QR at the register.' },
        { status: 400 }
      );
    }

    // Verify token freshness (allow 120 seconds maximum to give them time to type)
    const MAX_AGE_MS = 120 * 1000;
    const tokenTime = parseInt(t, 10);
    if (isNaN(tokenTime) || Date.now() - tokenTime > MAX_AGE_MS) {
      return NextResponse.json(
        { error: 'QR Code Expired. Please scan the refreshing code at the register again.' },
        { status: 400 }
      );
    }

    // Verify token cryptographic signature
    const secret = process.env.JWT_SECRET || 'rekur-digital-qr-secret-key-2026';
    const expectedSignature = crypto.createHmac('sha256', secret).update(t + shopCode).digest('hex');
    
    if (s !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid security signature. Please rescan.' },
        { status: 400 }
      );
    }

    if (!validateEgyptPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Find shop
    const shopResult = await client.query(
      'SELECT id, name, "walletEnabled" FROM "Shop" WHERE "qrCode" = $1',
      [shopCode]
    );

    if (shopResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Invalid shop code' },
        { status: 404 }
      );
    }

    const shopId = shopResult.rows[0].id;
    const shopName = shopResult.rows[0].name;
    const walletEnabled = shopResult.rows[0].walletEnabled;
    const now = new Date();
    const COOLDOWN_MS = 7 * 60 * 1000;

    // Find or create customer
    const customerResult = await client.query(
      'SELECT id FROM "Customer" WHERE "phoneNumber" = $1',
      [phoneNumber]
    );

    let customerId: string;
    if (customerResult.rows.length === 0) {
      const newCustomer = await client.query(
        'INSERT INTO "Customer" (id, "phoneNumber", "createdAt") VALUES ($1, $2, NOW()) RETURNING id',
        [nanoid(), phoneNumber]
      );
      customerId = newCustomer.rows[0].id;
    } else {
      customerId = customerResult.rows[0].id;
    }

    // Find or create stamp record
    const stampResult = await client.query(
      'SELECT *, EXTRACT(EPOCH FROM (NOW() - "lastScannedAt")) AS seconds_since_scan FROM "Stamp" WHERE "shopId" = $1 AND "customerId" = $2',
      [shopId, customerId]
    );

    let stamp: any;
    if (stampResult.rows.length === 0) {
      const newStamp = await client.query(
        'INSERT INTO "Stamp" (id, "shopId", "customerId", "stampCount", "createdAt", "updatedAt") VALUES ($1, $2, $3, 0, NOW(), NOW()) RETURNING *',
        [nanoid(), shopId, customerId]
      );
      stamp = newStamp.rows[0];
    } else {
      stamp = stampResult.rows[0];
    }

    // Check if reward expired
    if (stamp.rewardActive && stamp.rewardExpiresAt && new Date(stamp.rewardExpiresAt) <= now) {
      await client.query(
        'UPDATE "Stamp" SET "rewardActive" = false, "stampCount" = 0 WHERE id = $1',
        [stamp.id]
      );
      stamp.rewardActive = false;
      stamp.stampCount = 0;
    }

    // Check cooldown using database's timezone-proof calculation
    if (stamp.lastScannedAt && stamp.seconds_since_scan !== null) {
      if (stamp.seconds_since_scan * 1000 < COOLDOWN_MS) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Please wait before scanning again' },
          { status: 429 }
        );
      }
    }

    // Calculate new stamp count and reward
    let newStampCount = stamp.stampCount + 1;
    let rewardActive = false;
    let rewardExpiresAt = null;

    if (newStampCount >= 10) {
      rewardActive = true;
      rewardExpiresAt = new Date(now.getTime() + 7 * 60 * 1000);
      newStampCount = 0;
    }

    // Update stamp (increment totalScans always, totalRewards only when reward triggered)
    const updatedStamp = await client.query(
      `UPDATE "Stamp" SET "stampCount" = $1, "lastScannedAt" = $2, "rewardActive" = $3, "rewardExpiresAt" = $4, "updatedAt" = NOW(),
       "totalScans" = "totalScans" + 1,
       "totalRewards" = "totalRewards" + ${rewardActive ? 1 : 0}
       WHERE id = $5 RETURNING "stampCount", "rewardActive", "rewardExpiresAt", "passSerialNumber"`,
      [newStampCount, now, rewardActive, rewardExpiresAt, stamp.id]
    );

    await client.query('COMMIT');

    let passUrl: string | undefined;

    if (walletEnabled) {
      const existingSerial = updatedStamp.rows[0].passSerialNumber;
      if (!existingSerial) {
        // First time — create a new pass
        try {
          const passResult = await createPass(stamp.id, updatedStamp.rows[0].stampCount, shopName);
          passUrl = passResult.passUrl;
        } catch (err) {
          console.error('Pass creation failed (stamp already saved):', err);
        }
      } else {
        // Pass already exists — always return the URL so the button shows,
        // and push an update to refresh the installed pass in the background
        passUrl = `https://walletwallet.dev/pass/${existingSerial}`;
        pushPassUpdate(
          existingSerial,
          stamp.id,
          updatedStamp.rows[0].stampCount,
          shopName,
          updatedStamp.rows[0].rewardActive,
        ).catch(console.error);
      }
    }

    return NextResponse.json({
      success: true,
      stampCount: updatedStamp.rows[0].stampCount,
      rewardActive: updatedStamp.rows[0].rewardActive,
      rewardExpiresAt: updatedStamp.rows[0].rewardExpiresAt,
      ...(passUrl ? { passUrl } : {}),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in /api/stamp:', error);
    return NextResponse.json(
      { error: 'Something went wrong, please try again' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
