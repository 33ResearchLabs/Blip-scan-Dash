'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, User, CheckCircle2, XCircle, Lock } from 'lucide-react';

interface Trade {
  id: string;
  escrow_address: string;
  deal_id: string;
  merchant_pubkey: string;
  buyer_pubkey: string | null;
  arbiter_pubkey: string;
  treasury_pubkey: string;
  mint_address: string;
  amount: string;
  fee_bps: number;
  status: 'funded' | 'locked' | 'released' | 'refunded';
  created_at: string;
  locked_at: string | null;
  released_at: string | null;
  created_slot: number;
  locked_slot: number | null;
  released_slot: number | null;
}

interface Event {
  id: string;
  event_type: string;
  signature: string;
  slot: number;
  block_time: string;
  signer: string;
}

export default function TradePage({ params }: { params: { escrow: string } }) {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTradeDetails();
    fetchEvents();
  }, [params.escrow]);

  const fetchTradeDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trades/${params.escrow}`);
      const data = await response.json();
      setTrade(data);
    } catch (error) {
      console.error('Error fetching trade:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/events/${params.escrow}`);
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '—';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatFullAddress = (address: string) => {
    if (!address) return '—';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatAmount = (amount: string) => {
    const num = parseInt(amount) / 1_000_000;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatTime = (timestamp: string | null) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funded': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'locked': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'released': return 'bg-primary/10 text-primary border-primary/20';
      case 'refunded': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-secondary/50 text-muted-foreground border-border/30';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'created': return <User size={14} className="text-blue-500" />;
      case 'locked': return <Lock size={14} className="text-yellow-500" />;
      case 'released': return <CheckCircle2 size={14} className="text-primary" />;
      case 'refunded': return <XCircle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Trade not found</p>
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

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to explorer
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Trade Details</h1>
            <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(trade.status)}`}>
              {trade.status.toUpperCase()}
            </div>
          </div>
          <p className="text-sm font-mono text-muted-foreground">{trade.escrow_address}</p>
        </div>

        {/* Amount Card */}
        <div className="p-6 rounded-2xl bg-secondary/40 backdrop-blur-sm border border-border/30 mb-6">
          <p className="text-xs text-muted-foreground/60 mb-1">Amount</p>
          <h2 className="text-3xl font-semibold text-foreground tracking-tight">
            ${formatAmount(trade.amount)}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Fee: {(trade.fee_bps / 100).toFixed(2)}%
          </p>
        </div>

        {/* Participants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-secondary/40 backdrop-blur-sm border border-border/30">
            <p className="text-xs text-muted-foreground/60 mb-2">Merchant</p>
            <Link
              href={`/merchant/${trade.merchant_pubkey}`}
              className="font-mono text-sm text-foreground hover:text-primary transition-colors"
            >
              {formatFullAddress(trade.merchant_pubkey)}
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/40 backdrop-blur-sm border border-border/30">
            <p className="text-xs text-muted-foreground/60 mb-2">Buyer</p>
            {trade.buyer_pubkey ? (
              <Link
                href={`/merchant/${trade.buyer_pubkey}`}
                className="font-mono text-sm text-foreground hover:text-primary transition-colors"
              >
                {formatFullAddress(trade.buyer_pubkey)}
              </Link>
            ) : (
              <p className="font-mono text-sm text-muted-foreground">Not locked yet</p>
            )}
          </div>
        </div>

        {/* Technical Details */}
        <div className="p-4 rounded-2xl bg-secondary/40 backdrop-blur-sm border border-border/30 mb-6">
          <p className="text-xs font-semibold text-foreground mb-3">Technical Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground/60 mb-1">Deal ID</p>
              <p className="font-mono text-foreground">{trade.deal_id}</p>
            </div>
            <div>
              <p className="text-muted-foreground/60 mb-1">Mint Address</p>
              <p className="font-mono text-foreground">{formatFullAddress(trade.mint_address)}</p>
            </div>
            <div>
              <p className="text-muted-foreground/60 mb-1">Arbiter</p>
              <p className="font-mono text-foreground">{formatFullAddress(trade.arbiter_pubkey)}</p>
            </div>
            <div>
              <p className="text-muted-foreground/60 mb-1">Treasury</p>
              <p className="font-mono text-foreground">{formatFullAddress(trade.treasury_pubkey)}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4 rounded-2xl bg-secondary/40 backdrop-blur-sm border border-border/30">
          <p className="text-xs font-semibold text-foreground mb-4">Timeline</p>

          <div className="space-y-3">
            {events.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-lg bg-secondary/60 border border-border/30 flex items-center justify-center">
                    {getEventIcon(event.event_type)}
                  </div>
                  {index < events.length - 1 && (
                    <div className="w-px h-8 bg-border/30 my-1" />
                  )}
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground capitalize">
                      {event.event_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(event.block_time)}
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Signer: <span className="font-mono">{formatAddress(event.signer)}</span>
                    </p>
                    <p>
                      Slot: <span className="font-mono">{event.slot.toLocaleString()}</span>
                    </p>
                    <a
                      href={`https://explorer.solana.com/tx/${event.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View transaction →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
