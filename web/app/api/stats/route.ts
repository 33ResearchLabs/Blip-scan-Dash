import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'blipscan',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

export async function GET(request: NextRequest) {
  try {
    const [totalTrades, totalVolume, activeMerchants, avgTime] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM trades'),
      pool.query('SELECT SUM(amount::BIGINT) as total FROM trades WHERE status = $1', ['released']),
      pool.query('SELECT COUNT(DISTINCT merchant_pubkey) as count FROM trades'),
      pool.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (released_at - locked_at))) as avg_seconds
        FROM trades
        WHERE status = 'released' AND locked_at IS NOT NULL AND released_at IS NOT NULL
      `),
    ]);

    return NextResponse.json({
      total_trades: parseInt(totalTrades.rows[0].count),
      total_volume: totalVolume.rows[0].total || '0',
      active_merchants: parseInt(activeMerchants.rows[0].count),
      avg_completion_time: parseFloat(avgTime.rows[0].avg_seconds || '0'),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
