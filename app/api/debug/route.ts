import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET() {
  try {
    // Get all tables
    const tables = await query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

    const tableInfo: any = {};

    // Get info about each table
    for (const table of tables.rows) {
      const tableName = table.table_name;
      const columns = await query(`
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName]);

      const count = await query(`SELECT COUNT(*) as count FROM "${tableName}"`);

      tableInfo[tableName] = {
        columns: columns.rows,
        rowCount: parseInt(count.rows[0].count),
      };
    }

    return NextResponse.json({
      status: '✓ Debug info',
      tables: tableInfo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: '✗ Error',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
