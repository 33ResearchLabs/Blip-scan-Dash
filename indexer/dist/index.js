"use strict";
/**
 * BlipScan Indexer
 * Reads Solana escrow program transactions and indexes them to PostgreSQL
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv.config();
// Load IDL
const idlPath = './blip_escrow_idl.json';
const IDL = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
// ============================================
// CONFIGURATION
// ============================================
const PROGRAM_ID = new web3_js_1.PublicKey('HZ9ZSXtebTKYGRR7ZNsetroAT7Kh8ymKExcf5FF9dLNq');
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const POLL_INTERVAL = 5000; // 5 seconds
// PostgreSQL connection
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'blipscan',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});
// ============================================
// INDEXER CLASS
// ============================================
class BlipScanIndexer {
    constructor() {
        this.lastProcessedSignature = null;
        this.lastProcessedSlot = 0;
        this.connection = new web3_js_1.Connection(RPC_URL, 'confirmed');
        this.coder = new anchor_1.BorshAccountsCoder(IDL);
    }
    async start() {
        console.log('🚀 BlipScan Indexer Starting...');
        console.log(`📡 RPC: ${RPC_URL}`);
        console.log(`🔗 Program: ${PROGRAM_ID.toString()}`);
        // Load last cursor
        await this.loadCursor();
        // Start polling
        this.poll();
    }
    async loadCursor() {
        const result = await pool.query('SELECT last_processed_signature, last_processed_slot FROM indexer_cursor WHERE program_id = $1', [PROGRAM_ID.toString()]);
        if (result.rows.length > 0) {
            this.lastProcessedSignature = result.rows[0].last_processed_signature;
            this.lastProcessedSlot = result.rows[0].last_processed_slot || 0;
            console.log(`📍 Resuming from slot ${this.lastProcessedSlot}`);
        }
    }
    async poll() {
        try {
            await this.fetchAndIndexTransactions();
        }
        catch (error) {
            console.error('❌ Error polling:', error);
        }
        setTimeout(() => this.poll(), POLL_INTERVAL);
    }
    async fetchAndIndexTransactions() {
        // Get signatures for program
        const signatures = await this.connection.getSignaturesForAddress(PROGRAM_ID, {
            limit: 50,
            before: this.lastProcessedSignature || undefined,
        });
        if (signatures.length === 0) {
            return;
        }
        console.log(`📥 Found ${signatures.length} new transactions`);
        // Process in reverse (oldest first)
        for (const sig of signatures.reverse()) {
            try {
                await this.processTransaction(sig.signature, sig.slot, sig.blockTime || null);
            }
            catch (error) {
                console.error(`Error processing ${sig.signature}:`, error);
            }
        }
        // Update cursor
        const latest = signatures[0];
        this.lastProcessedSignature = latest.signature;
        this.lastProcessedSlot = latest.slot;
        await pool.query('UPDATE indexer_cursor SET last_processed_signature = $1, last_processed_slot = $2, last_indexed_at = NOW() WHERE program_id = $3', [this.lastProcessedSignature, this.lastProcessedSlot, PROGRAM_ID.toString()]);
    }
    async processTransaction(signature, slot, blockTime) {
        const tx = await this.connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
        });
        if (!tx || !tx.meta) {
            return;
        }
        const logs = tx.meta.logMessages || [];
        const timestamp = blockTime ? new Date(blockTime * 1000) : new Date();
        // Detect instruction type from logs
        const instructionType = this.detectInstructionType(logs);
        if (!instructionType) {
            return;
        }
        console.log(`  📝 ${instructionType.toUpperCase()} - ${signature.slice(0, 8)}...`);
        // Extract escrow address from account keys
        const escrowAddress = await this.extractEscrowAddress(tx);
        if (!escrowAddress) {
            return;
        }
        switch (instructionType) {
            case 'create_escrow':
                await this.handleCreateEscrow(signature, escrowAddress, slot, timestamp);
                break;
            case 'lock_for_taker':
                await this.handleLockForTaker(signature, escrowAddress, slot, timestamp);
                break;
            case 'release_to_taker':
                await this.handleReleaseToTaker(signature, escrowAddress, slot, timestamp);
                break;
            case 'refund_to_maker':
                await this.handleRefundToMaker(signature, escrowAddress, slot, timestamp);
                break;
        }
    }
    detectInstructionType(logs) {
        for (const log of logs) {
            if (log.includes('Instruction: CreateEscrow'))
                return 'create_escrow';
            if (log.includes('Instruction: LockForTaker'))
                return 'lock_for_taker';
            if (log.includes('Instruction: ReleaseToTaker'))
                return 'release_to_taker';
            if (log.includes('Instruction: RefundToMaker'))
                return 'refund_to_maker';
        }
        return null;
    }
    async extractEscrowAddress(tx) {
        // The Escrow account has a specific discriminator [31, 213, 123, 187, 186, 22, 218, 155]
        const escrowDiscriminator = Buffer.from([31, 213, 123, 187, 186, 22, 218, 155]);
        const accounts = tx.transaction.message.accountKeys;
        for (const account of accounts) {
            try {
                const pubkey = typeof account === 'string' ? account : account.pubkey.toString();
                const accountInfo = await this.connection.getAccountInfo(new web3_js_1.PublicKey(pubkey));
                if (accountInfo && accountInfo.owner.toString() === PROGRAM_ID.toString()) {
                    // Check if discriminator matches
                    const dataDiscriminator = accountInfo.data.slice(0, 8);
                    if (dataDiscriminator.equals(escrowDiscriminator)) {
                        return pubkey;
                    }
                }
            }
            catch (error) {
                continue;
            }
        }
        return null;
    }
    async handleCreateEscrow(signature, escrowAddress, slot, timestamp) {
        try {
            // Fetch escrow account data
            const accountInfo = await this.connection.getAccountInfo(new web3_js_1.PublicKey(escrowAddress));
            if (!accountInfo) {
                console.log('  ⚠️ Escrow account not found');
                return;
            }
            // Parse escrow data (simplified - in production use Anchor deserialization)
            const escrow = await this.parseEscrowAccount(accountInfo.data);
            // Insert trade
            const result = await pool.query(`INSERT INTO trades (
          escrow_address, deal_id, signature,
          merchant_pubkey, buyer_pubkey, arbiter_pubkey, treasury_pubkey,
          mint_address, amount, fee_bps,
          status, created_slot, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (escrow_address) DO NOTHING
        RETURNING id`, [
                escrowAddress,
                escrow.dealId,
                signature,
                escrow.maker,
                escrow.taker === web3_js_1.PublicKey.default.toString() ? null : escrow.taker,
                escrow.arbiter,
                escrow.treasury,
                escrow.mint,
                escrow.amount.toString(),
                escrow.feeBps,
                'funded',
                slot,
                timestamp,
            ]);
            if (result.rows.length > 0) {
                // Insert event
                await this.insertEvent(result.rows[0].id, escrowAddress, 'created', signature, slot, timestamp, escrow.maker);
                console.log(`    ✅ Trade created: ${escrow.amount} tokens`);
            }
        }
        catch (error) {
            console.error('  ❌ Error handling create_escrow:', error);
        }
    }
    async handleLockForTaker(signature, escrowAddress, slot, timestamp) {
        try {
            const accountInfo = await this.connection.getAccountInfo(new web3_js_1.PublicKey(escrowAddress));
            if (!accountInfo)
                return;
            const escrow = await this.parseEscrowAccount(accountInfo.data);
            await pool.query(`UPDATE trades
        SET status = 'locked', buyer_pubkey = $1, locked_slot = $2, locked_at = $3, updated_at = NOW()
        WHERE escrow_address = $4`, [escrow.taker, slot, timestamp, escrowAddress]);
            const tradeResult = await pool.query('SELECT id FROM trades WHERE escrow_address = $1', [escrowAddress]);
            if (tradeResult.rows.length > 0) {
                await this.insertEvent(tradeResult.rows[0].id, escrowAddress, 'locked', signature, slot, timestamp, escrow.taker);
                console.log(`    ✅ Trade locked by ${escrow.taker.slice(0, 8)}...`);
            }
        }
        catch (error) {
            console.error('  ❌ Error handling lock_for_taker:', error);
        }
    }
    async handleReleaseToTaker(signature, escrowAddress, slot, timestamp) {
        try {
            await pool.query(`UPDATE trades
        SET status = 'released', released_slot = $1, released_at = $2, updated_at = NOW()
        WHERE escrow_address = $3`, [slot, timestamp, escrowAddress]);
            const tradeResult = await pool.query('SELECT id, merchant_pubkey FROM trades WHERE escrow_address = $1', [escrowAddress]);
            if (tradeResult.rows.length > 0) {
                await this.insertEvent(tradeResult.rows[0].id, escrowAddress, 'released', signature, slot, timestamp, tradeResult.rows[0].merchant_pubkey);
                console.log(`    ✅ Trade released`);
            }
        }
        catch (error) {
            console.error('  ❌ Error handling release_to_taker:', error);
        }
    }
    async handleRefundToMaker(signature, escrowAddress, slot, timestamp) {
        try {
            await pool.query(`UPDATE trades
        SET status = 'refunded', updated_at = NOW()
        WHERE escrow_address = $1`, [escrowAddress]);
            const tradeResult = await pool.query('SELECT id, merchant_pubkey FROM trades WHERE escrow_address = $1', [escrowAddress]);
            if (tradeResult.rows.length > 0) {
                await this.insertEvent(tradeResult.rows[0].id, escrowAddress, 'refunded', signature, slot, timestamp, tradeResult.rows[0].merchant_pubkey);
                console.log(`    ✅ Trade refunded`);
            }
        }
        catch (error) {
            console.error('  ❌ Error handling refund_to_maker:', error);
        }
    }
    async parseEscrowAccount(data) {
        // Use Anchor's BorshAccountsCoder to properly deserialize
        const decoded = this.coder.decode('Escrow', data);
        if (!decoded) {
            throw new Error('Failed to decode escrow account');
        }
        // Convert status enum to string
        const statusMap = ['funded', 'locked', 'released', 'refunded'];
        const statusIndex = Object.keys(decoded.status)[0];
        const statusStr = statusMap[parseInt(statusIndex)] || 'funded';
        // dealId is already a Uint8Array/Buffer
        const dealIdHex = decoded.dealId ?
            (Buffer.isBuffer(decoded.dealId) ? decoded.dealId : Buffer.from(decoded.dealId)).toString('hex') :
            '';
        const result = {
            version: decoded.version || 0,
            dealId: dealIdHex,
            maker: decoded.maker.toString(),
            taker: decoded.taker.toString(),
            arbiter: decoded.arbiter.toString(),
            treasury: decoded.treasury.toString(),
            mint: decoded.mint.toString(),
            amount: decoded.amount || BigInt(0),
            feeBps: decoded.feeBps || 0,
            status: statusStr,
        };
        console.log(`    📊 Parsed: ${result.amount} tokens, fee ${result.feeBps}bps, mint ${result.mint.slice(0, 8)}...`);
        return result;
    }
    async insertEvent(tradeId, escrowAddress, eventType, signature, slot, blockTime, signer) {
        await pool.query(`INSERT INTO trade_events (trade_id, escrow_address, event_type, signature, slot, block_time, signer)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`, [tradeId, escrowAddress, eventType, signature, slot, blockTime, signer]);
    }
}
// ============================================
// START INDEXER
// ============================================
const indexer = new BlipScanIndexer();
indexer.start().catch(console.error);
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down...');
    await pool.end();
    process.exit(0);
});
