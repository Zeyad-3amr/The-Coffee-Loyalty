import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET() {
  try {
    // Try to query the database
    const result = await query('SELECT NOW() as timestamp');

    return NextResponse.json({
      status: '✓ Connected to Supabase',
      timestamp: result.rows[0].timestamp,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: '✗ Failed to connect to Supabase',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
