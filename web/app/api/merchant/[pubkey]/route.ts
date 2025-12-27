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
  { params }: { params: { pubkey: string } }
) {
  try {
    const result = await pool.query(
      'SELECT * FROM merchant_stats WHERE merchant_pubkey = $1',
      [params.pubkey]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching merchant stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchant stats' },
      { status: 500 }
    );
  }
}
