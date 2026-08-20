import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { isValidHex } from '@/app/lib/theme';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    const body = await request.json();

    // Build a partial update from only the fields provided.
    const sets: string[] = [];
    const values: any[] = [];

    if ('logoUrl' in body) {
      sets.push(`"logoUrl" = $${sets.length + 1}`);
      values.push(body.logoUrl || null);
    }

    if ('brandColor' in body) {
      const color = body.brandColor;
      // Allow clearing (null/empty) → falls back to Rekur amber. Otherwise validate.
      if (color && !isValidHex(color)) {
        return NextResponse.json({ error: 'Invalid color. Use a hex like #f59e0b.' }, { status: 400 });
      }
      sets.push(`"brandColor" = $${sets.length + 1}`);
      values.push(color ? color : null);
    }

    if ('bgColor' in body) {
      const color = body.bgColor;
      if (color && !isValidHex(color)) {
        return NextResponse.json({ error: 'Invalid background color. Use a hex like #e7d3b8.' }, { status: 400 });
      }
      sets.push(`"bgColor" = $${sets.length + 1}`);
      values.push(color ? color : null);
    }

    if ('textColor' in body) {
      const mode = body.textColor;
      if (mode && mode !== 'dark' && mode !== 'light') {
        return NextResponse.json({ error: 'Text color must be "dark" or "light".' }, { status: 400 });
      }
      sets.push(`"textColor" = $${sets.length + 1}`);
      values.push(mode ? mode : null);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    values.push(params.shopId);
    await query(
      `UPDATE "Shop" SET ${sets.join(', ')} WHERE id = $${values.length}`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}
