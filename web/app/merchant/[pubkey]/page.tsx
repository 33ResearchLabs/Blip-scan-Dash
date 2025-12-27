'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Clock, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';

interface MerchantStats {
  merchant_pubkey: string;
  total_trades: number;
  completed_trades: number;
  locked_trades: number;
  refunded_trades: number;
  total_volume: string;
  completion_rate: number;
  avg_completion_time: number;
  reputation_score: number;
  first_trade_at: string;
  last_trade_at: string;
}

interface Trade {
  id: string;
  escrow_address: string;
  merchant_pubkey: string;
  buyer_pubkey: string | null;
  amount: string;
  status: 'funded' | 'locked' | 'released' | 'refunded';
  created_at: string;
  released_at: string | null;
}

export default function MerchantPage({ params }: { params: { pubkey: string } }) {
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMerchantData();
  }, [params.pubkey]);

  const fetchMerchantData = async () => {
    try {
      setLoading(true);
      const [statsRes, tradesRes] = await Promise.all([
        fetch(`/api/merchant/${params.pubkey}`),
        fetch(`/api/merchant/${params.pubkey}/trades`),
      ]);

      const statsData = await statsRes.json();
      const tradesData = await tradesRes.json();

      setStats(statsData);
      setTrades(tradesData.trades || []);
    } catch (error) {
      console.error('Error fetching merchant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '—';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatFullAddress = (address: string) => {
    if (!address) return '—';
    return `${address.slice(0, 12)}...${address.slice(-12)}`;
  };

  const formatAmount = (amount: string) => {
    const num = parseInt(amount) / 1_000_000;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funded': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'locked': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'released': return 'bg-primary/10 text-primary border-primary/20';
      case 'refunded': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-secondary/50 text-muted-foreground border-border/30';
    }
  };

  const getReputationColor = (score: number) => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getReputationLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Merchant not found</p>
          <Link href="/" className="text-sm text-primary hover:underline mt-2 inline-block">
            ← Back to explorer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-[-10%] right-[-20%] w-[60%] h-[40%] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-[80px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-15%] left-[-20%] w-[50%] h-[40%] bg-gradient-to-tr from-primary/5 to-transparent blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to explorer
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
            Merchant Profile
          </h1>
          <p className="text-sm font-mono text-muted-foreground">{params.pubkey}</p>
        </div>

        {/* Reputation Score */}
        <div className="p-6 rounded-2xl bg-secondary/40 backdrop-blur-sm border border-border/30 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground/60 mb-1">Reputation Score</p>
              <div className="flex items-baseline gap-2">
                <h2 className={`text-4xl font-semibold tracking-tight ${getReputationColor(stats.reputation_score)}`}>
                  {stats.reputation_score.toFixed(1)}
                </h2>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <p className={`text-xs font-medium mt-1 ${getReputationColor(stats.reputation_score)}`}>
                {getReputationLabel(stats.reputation_score)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground/60 mb-1">Completion Rate</p>
              <p className="text-2xl font-semibold text-foreground">
                {stats.completion_rate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Reputation breakdown */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground/60 mb-1">Completion</p>
                <p className="font-medium text-foreground">
                  {(stats.completion_rate * 0.6).toFixed(1)} pts
                </p>
              </div>
              <div>
                <p className="text-muted-foreground/60 mb-1">Volume Bonus</p>
                <p className="font-medium text-foreground">
                  {Math.min(20, Math.floor(stats.completed_trades / 5)).toFixed(1)} pts
                </p>
              </div>
              <div>
                <p className="text-muted-foreground/60 mb-1">Speed Bonus</p>
                <p className="font-medium text-foreground">
                  {Math.max(0, 20 - (stats.avg_completion_time / 3600 * 0.83)).toFixed(1)} pts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-secondary/40 backdrop-blur-sm border border-border/30">
            <div className="w-8 h-8 rounded-lg bg-secondary/60 border border-border/30 flex items-center justify-center mb-2">
              <TrendingUp size={14} className="text-primary" />
            </div>
            <p className="text-xl font-semibold text-foreground">
              {stats.total_trades.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Trades</p>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/40 backdrop-blur-sm border border-border/30">
            <div className="w-8 h-8 rounded-lg bg-secondary/60 border border-border/30 flex items-center justify-center mb-2">
              <span className="text-xs font-bold text-primary">$</span>
            </div>
            <p className="text-xl font-semibold text-foreground">
              ${formatAmount(stats.total_volume)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Volume</p>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/40 backdrop-blur-sm border border-border/30">
            <div className="w-8 h-8 rounded-lg bg-secondary/60 border border-border/30 flex items-center justify-center mb-2">
              <CheckCircle2 size={14} className="text-primary" />
            </div>
            <p className="text-xl font-semibold text-foreground">
              {stats.completed_trades.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/40 backdrop-blur-sm border border-border/30">
            <div className="w-8 h-8 rounded-lg bg-secondary/60 border border-border/30 flex items-center justify-center mb-2">
              <Clock size={14} className="text-primary" />
            </div>
            <p className="text-xl font-semibold text-foreground">
              {Math.round(stats.avg_completion_time / 60)}m
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Avg. Time</p>
          </div>
        </div>

        {/* Trade Breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-lg font-semibold text-primary">
              {stats.completed_trades.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Released</p>
          </div>

          <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
            <p className="text-lg font-semibold text-yellow-500">
              {stats.locked_trades.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Locked</p>
          </div>

          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
            <p className="text-lg font-semibold text-red-500">
              {stats.refunded_trades.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Refunded</p>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Trades</h3>
          <div className="space-y-3">
            {trades.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No trades found</p>
              </div>
            ) : (
              trades.map((trade) => (
                <Link
                  key={trade.id}
                  href={`/trade/${trade.escrow_address}`}
                  className="block p-4 rounded-2xl bg-secondary/40 backdrop-blur-sm border border-border/30 hover:border-border/50 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-mono font-medium text-foreground">
                          {formatAddress(trade.escrow_address)}
                        </span>
                        <div className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${getStatusColor(trade.status)}`}>
                          {trade.status.toUpperCase()}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground/60 mb-0.5">Amount</p>
                          <p className="font-medium text-foreground">${formatAmount(trade.amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground/60 mb-0.5">Buyer</p>
                          <p className="font-mono font-medium text-foreground">
                            {formatAddress(trade.buyer_pubkey || '')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground/60 mb-0.5">Created</p>
                          <p className="font-medium text-foreground">{formatTime(trade.created_at)}</p>
                        </div>
                      </div>
                    </div>

                    <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
