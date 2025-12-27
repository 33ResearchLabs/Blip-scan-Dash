import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'blipscan',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { escrow: string } }
) {
  try {
    const result = await pool.query(
      'SELECT * FROM trade_events WHERE escrow_address = $1 ORDER BY block_time DESC',
      [params.escrow]
    );

    return NextResponse.json({
      events: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
