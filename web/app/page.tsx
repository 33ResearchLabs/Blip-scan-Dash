'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, TrendingUp, Activity, DollarSign, Clock, CheckCircle, Copy, ChevronRight, BarChart3 } from 'lucide-react';

interface Trade {
  id: string;
  escrow_address: string;
  merchant_pubkey: string;
  buyer_pubkey: string | null;
  amount: string;
  fee_bps: number;
  mint_address: string;
  status: 'funded' | 'locked' | 'released' | 'refunded';
  created_at: string;
  locked_at: string | null;
  released_at: string | null;
  created_slot: number;
  locked_slot: number | null;
  released_slot: number | null;
}

interface Stats {
  total_trades: number;
  total_volume: string;
  active_merchants: number;
  avg_completion_time: number;
}

export default function HomePage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<'all' | 'funded' | 'locked' | 'released' | 'refunded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    fetchTrades();
    fetchStats();
    const interval = setInterval(() => {
      fetchTrades();
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trades?status=${filter !== 'all' ? filter : ''}&limit=50`);
      const data = await response.json();
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatAddress = (address: string, length: 'short' | 'medium' | 'long' = 'short') => {
    if (!address) return '—';
    if (length === 'short') return `${address.slice(0, 4)}...${address.slice(-4)}`;
    if (length === 'medium') return `${address.slice(0, 8)}...${address.slice(-8)}`;
    return `${address.slice(0, 16)}...${address.slice(-16)}`;
  };

  const formatAmount = (amount: string) => {
    const num = parseInt(amount) / 1_000_000;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds} secs ago`;
    if (minutes < 60) return `${minutes} mins ago`;
    if (hours < 24) return `${hours} hrs ago`;
    return `${days} days ago`;
  };

  const formatAbsoluteTime = (timestamp: string | null) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      funded: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      locked: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      released: 'bg-primary/10 text-primary border-primary/20',
      refunded: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return styles[status as keyof typeof styles] || 'bg-secondary/50 text-muted-foreground border-border/30';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'released':
        return <CheckCircle size={12} className="text-primary" />;
      default:
        return <Activity size={12} />;
    }
  };

  const filteredTrades = trades.filter(trade => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      trade.escrow_address.toLowerCase().includes(query) ||
      trade.merchant_pubkey.toLowerCase().includes(query) ||
      (trade.buyer_pubkey && trade.buyer_pubkey.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BarChart3 size={18} className="text-primary" />
                </div>
                <span className="text-lg font-semibold text-foreground">BlipScan</span>
              </Link>

              <nav className="hidden md:flex items-center gap-6 text-sm">
                <Link href="/" className="text-primary font-medium">
                  Trades
                </Link>
                <Link href="/merchants" className="text-muted-foreground hover:text-foreground transition-colors">
                  Merchants
                </Link>
                <Link href="/stats" className="text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/30 border border-border/30">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Devnet</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-card border border-border/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Trades</span>
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                  <Activity size={14} className="text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {stats.total_trades.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp size={12} className="text-primary" />
                <span>All time</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Volume</span>
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                  <DollarSign size={14} className="text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                ${formatAmount(stats.total_volume)}
              </div>
              <div className="text-xs text-muted-foreground">USDT equivalent</div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Merchants</span>
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">M</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {stats.active_merchants.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Unique addresses</div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg. Settlement</span>
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                  <Clock size={14} className="text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {Math.round(stats.avg_completion_time / 60)}m
              </div>
              <div className="text-xs text-muted-foreground">Time to complete</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by escrow address, merchant, or buyer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border/40 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'funded', 'locked', 'released', 'refunded'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    filter === status
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card text-muted-foreground border border-border/40 hover:border-border/60 hover:text-foreground'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trades Table */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/20">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Escrow Address
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Merchant
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Buyer
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Age
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading trades...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No trades found
                    </td>
                  </tr>
                ) : (
                  filteredTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/trade/${trade.escrow_address}`}
                            className="font-mono text-sm text-primary hover:underline"
                          >
                            {formatAddress(trade.escrow_address, 'medium')}
                          </Link>
                          <button
                            onClick={() => copyToClipboard(trade.escrow_address)}
                            className="p-1 hover:bg-secondary/50 rounded transition-colors"
                            title="Copy address"
                          >
                            {copiedAddress === trade.escrow_address ? (
                              <CheckCircle size={12} className="text-primary" />
                            ) : (
                              <Copy size={12} className="text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Slot: {trade.created_slot.toLocaleString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${getStatusBadge(trade.status)}`}>
                          {getStatusIcon(trade.status)}
                          <span>{trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-foreground">
                          ${formatAmount(trade.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {trade.fee_bps > 0 ? `Fee: ${(trade.fee_bps / 100).toFixed(2)}%` : 'No fee'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          href={`/merchant/${trade.merchant_pubkey}`}
                          className="font-mono text-xs text-foreground hover:text-primary transition-colors"
                        >
                          {formatAddress(trade.merchant_pubkey, 'medium')}
                        </Link>
                      </td>

                      <td className="py-3 px-4">
                        {trade.buyer_pubkey ? (
                          <Link
                            href={`/merchant/${trade.buyer_pubkey}`}
                            className="font-mono text-xs text-foreground hover:text-primary transition-colors"
                          >
                            {formatAddress(trade.buyer_pubkey, 'medium')}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not locked</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs text-foreground" title={formatAbsoluteTime(trade.created_at)}>
                          {formatTime(trade.created_at)}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/trade/${trade.escrow_address}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View
                          <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-border/40 bg-secondary/10 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {Math.min(filteredTrades.length, 50)} of {filteredTrades.length} trades</span>
              <span>Updates every 10 seconds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
