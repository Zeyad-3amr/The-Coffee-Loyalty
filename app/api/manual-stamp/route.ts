import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// Egypt phone validation: must start with 01 and be 11 digits total
function validateEgyptPhoneNumber(phone: string): boolean {
  const phoneRegex = /^01[0-9]{9}$/;
  return phoneRegex.test(phone);
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, shopId } = await request.json();

    // Validate inputs
    if (!phoneNumber || !shopId) {
      return NextResponse.json(
        { error: 'Phone number and shop ID are required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!validateEgyptPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be 11 digits starting with 01' },
        { status: 400 }
      );
    }

    // Find shop
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { phoneNumber },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: { phoneNumber },
      });
    }

    // Find or create stamp record for this shop + customer combo
    let stamp = await prisma.stamp.findUnique({
      where: {
        shopId_customerId: {
          shopId: shop.id,
          customerId: customer.id,
        },
      },
    });

    if (!stamp) {
      stamp = await prisma.stamp.create({
        data: {
          shopId: shop.id,
          customerId: customer.id,
          stampCount: 0,
        },
      });
    }

    const now = new Date();

    // Check if reward has expired, and reset if necessary
    if (stamp.rewardActive && stamp.rewardExpiresAt && stamp.rewardExpiresAt <= now) {
      stamp = await prisma.stamp.update({
        where: { id: stamp.id },
        data: {
          rewardActive: false,
          stampCount: 0,
        },
      });
    }

    // Increment stamp count (no cooldown check)
    let newStampCount = stamp.stampCount + 1;
    let rewardActive = false;
    let rewardExpiresAt = null;

    // Check if reward is earned
    if (newStampCount >= 10) {
      rewardActive = true;
      rewardExpiresAt = new Date(now.getTime() + 7 * 60 * 1000); // 7 minutes from now
      newStampCount = 0; // Reset stamp count
    }

    // Update stamp record
    const updatedStamp = await prisma.stamp.update({
      where: { id: stamp.id },
      data: {
        stampCount: newStampCount,
        lastScannedAt: now,
        rewardActive,
        rewardExpiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      stampCount: updatedStamp.stampCount,
      rewardActive: updatedStamp.rewardActive,
      rewardExpiresAt: updatedStamp.rewardExpiresAt,
      message: rewardActive ? 'Congratulations! You earned a free coffee!' : `Stamp added! ${updatedStamp.stampCount}/10`,
    });
  } catch (error) {
    console.error('Error in /api/manual-stamp:', error);
    return NextResponse.json(
      { error: 'Something went wrong, please try again' },
      { status: 500 }
    );
  }
}
