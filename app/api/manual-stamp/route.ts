import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/app/lib/db';
import { nanoid } from 'nanoid';

function validateEgyptPhoneNumber(phone: string): boolean {
  const phoneRegex = /^01[0-9]{9}$/;
  return phoneRegex.test(phone);
}

export async function POST(request: NextRequest) {
  const client = await getClient();

  try {
    const { phoneNumber, shopId } = await request.json();

    if (!phoneNumber || !shopId) {
      return NextResponse.json(
        { error: 'Phone number and shop ID are required' },
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
      'SELECT id FROM "Shop" WHERE id = $1',
      [shopId]
    );

    if (shopResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

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

    // Find or create stamp
    const stampResult = await client.query(
      'SELECT * FROM "Stamp" WHERE "shopId" = $1 AND "customerId" = $2',
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

    const now = new Date();

    // Check if reward expired
    if (stamp.rewardActive && stamp.rewardExpiresAt && new Date(stamp.rewardExpiresAt) <= now) {
      await client.query(
        'UPDATE "Stamp" SET "rewardActive" = false, "stampCount" = 0 WHERE id = $1',
        [stamp.id]
      );
      stamp.rewardActive = false;
      stamp.stampCount = 0;
    }

    // Increment stamp (no cooldown)
    let newStampCount = stamp.stampCount + 1;
    let rewardActive = false;
    let rewardExpiresAt = null;

    if (newStampCount >= 10) {
      rewardActive = true;
      rewardExpiresAt = new Date(now.getTime() + 7 * 60 * 1000);
      newStampCount = 0;
    }

    // Update stamp
    const updatedStamp = await client.query(
      'UPDATE "Stamp" SET "stampCount" = $1, "lastScannedAt" = $2, "rewardActive" = $3, "rewardExpiresAt" = $4, "updatedAt" = NOW() WHERE id = $5 RETURNING *',
      [newStampCount, now, rewardActive, rewardExpiresAt, stamp.id]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      stampCount: updatedStamp.rows[0].stampCount,
      rewardActive: updatedStamp.rows[0].rewardActive,
      rewardExpiresAt: updatedStamp.rows[0].rewardExpiresAt,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in /api/manual-stamp:', error);
    return NextResponse.json(
      { error: 'Something went wrong, please try again' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
