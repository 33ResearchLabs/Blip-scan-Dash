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
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await pool.query(
      'SELECT * FROM trades WHERE merchant_pubkey = $1 ORDER BY created_at DESC LIMIT $2',
      [params.pubkey, limit]
    );

    return NextResponse.json({
      trades: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Error fetching merchant trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchant trades' },
      { status: 500 }
    );
  }
}
