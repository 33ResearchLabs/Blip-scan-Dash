# BlipScan Setup Guide

Complete step-by-step setup instructions for BlipScan.

## Prerequisites

- PostgreSQL 12+ installed
- Node.js 18+ installed
- Access to Solana RPC (devnet or mainnet)

## Step-by-Step Setup

### 1. PostgreSQL Database

```bash
# Start PostgreSQL service
# macOS with Homebrew:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Create database
psql postgres -c "CREATE DATABASE blipscan;"

# Run schema
cd /Users/zeus/Downloads/blip-money-webapp-main/blipscan
psql blipscan < database/schema.sql

# Initialize cursor
psql blipscan < database/init_cursor.sql

# Verify setup
psql blipscan -c "\dt"
# Should show: trades, trade_events, merchant_stats, indexer_cursor
```

### 2. Indexer Setup

```bash
cd indexer

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=blipscan
# DB_USER=postgres
# DB_PASSWORD=your_password_here
# SOLANA_RPC_URL=https://api.devnet.solana.com

# Build TypeScript
npm run build

# Start indexer
npm start
```

**Expected Output:**
```
🚀 BlipScan Indexer Starting...
📡 RPC: https://api.devnet.solana.com
🔗 Program: HZ9ZSXtebTKYGRR7ZNsetroAT7Kh8ymKExcf5FF9dLNq
📍 Resuming from slot 0
📥 Found 3 new transactions
  📝 CREATE_ESCROW - a1b2c3d4...
    ✅ Trade created: 100000000 tokens
```

### 3. Web UI Setup

```bash
cd web

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env (same credentials as indexer):
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=blipscan
# DB_USER=postgres
# DB_PASSWORD=your_password_here

# Start development server
npm run dev
```

**Visit:** http://localhost:3001

### 4. Verify Everything Works

**Check Database:**
```bash
# Count trades
psql blipscan -c "SELECT COUNT(*) FROM trades;"

# View recent trades
psql blipscan -c "SELECT escrow_address, status, amount FROM trades ORDER BY created_at DESC LIMIT 5;"

# Check merchant stats
psql blipscan -c "SELECT merchant_pubkey, total_trades, reputation_score FROM merchant_stats LIMIT 5;"
```

**Check Indexer:**
```bash
# Should see periodic polling in console
# Every 5 seconds it checks for new transactions
```

**Check Web UI:**
- Homepage should show stats cards
- Clicking a trade should show full timeline
- Merchant pages should show reputation scores

## Production Deployment

### Indexer (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start indexer with PM2
cd indexer
pm2 start npm --name "blipscan-indexer" -- start

# Auto-restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 logs blipscan-indexer
pm2 monit
```

### Web UI (Vercel)

```bash
cd web

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard:
# DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
```

### Database (Managed)

Use a managed PostgreSQL service:

- **Supabase**: Free tier, easy setup
- **Railway**: $5/mo, includes backups
- **Digital Ocean**: $15/mo managed PostgreSQL

Update connection strings in both indexer and web `.env` files.

## Troubleshooting

### Indexer not finding transactions

```bash
# Check program exists
solana program show HZ9ZSXtebTKYGRR7ZNsetroAT7Kh8ymKExcf5FF9dLNq --url devnet

# Reset cursor to re-index everything
psql blipscan -c "UPDATE indexer_cursor SET last_processed_slot = 0, last_processed_signature = NULL WHERE program_id = 'HZ9ZSXtebTKYGRR7ZNsetroAT7Kh8ymKExcf5FF9dLNq';"

# Restart indexer
npm start
```

### Database connection errors

```bash
# Test connection
psql -h localhost -U postgres -d blipscan

# Check PostgreSQL is running
# macOS:
brew services list | grep postgresql

# Linux:
sudo systemctl status postgresql
```

### Web UI shows empty data

```bash
# Make sure indexer is running first
cd indexer && npm start

# Wait for it to index some trades
# Then refresh web UI
```

### RPC rate limiting

If you see rate limit errors, use a paid RPC:

```bash
# Helius (recommended)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# QuickNode
SOLANA_RPC_URL=https://your-endpoint.solana-mainnet.quiknode.pro/YOUR_KEY/

# Alchemy
SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY
```

## Maintenance

### Backup Database

```bash
# Dump database
pg_dump blipscan > blipscan_backup.sql

# Restore
psql blipscan < blipscan_backup.sql
```

### Update Schema

```bash
# Stop indexer first
pm2 stop blipscan-indexer

# Run migrations
psql blipscan < database/migrations/001_new_feature.sql

# Restart indexer
pm2 restart blipscan-indexer
```

### Monitor Performance

```bash
# Database size
psql blipscan -c "SELECT pg_size_pretty(pg_database_size('blipscan'));"

# Table sizes
psql blipscan -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text)) FROM pg_tables WHERE schemaname = 'public';"

# Indexer memory usage
pm2 show blipscan-indexer
```

## Support

- Issues: https://github.com/your-repo/blipscan/issues
- Docs: See README.md
