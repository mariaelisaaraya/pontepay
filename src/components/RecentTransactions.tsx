'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleDollarSign, Lock } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useTradeHistory, CompletedTrade } from '@/contexts/TradeHistoryContext';
import { useStore } from '@/lib/store';

const USDC_TESTNET_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';

interface ActivityItem {
  id: string;
  title: string;
  displayAmount: string;
  isPositive: boolean;
  dateIso: string;
}

interface HorizonPaymentRecord {
  id: string;
  type: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  from?: string;
  to?: string;
  amount?: string;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

function formatAmount(amount: number, currency: string): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ' + currency;
}

function mapTrade(trade: CompletedTrade): ActivityItem {
  const isPositive = trade.type === 'buy';
  return {
    id: trade.id,
    title: isPositive ? 'USDC Purchase' : 'USDC Sale',
    displayAmount: `${isPositive ? '+' : '-'}${formatAmount(trade.amount, 'USDC')}`,
    isPositive,
    dateIso: trade.date,
  };
}

// On-chain USDC transfers (Send/Receive) read straight from Horizon, so
// activity reflects reality even for payments made outside this app.
async function fetchUsdcTransfers(address: string): Promise<ActivityItem[]> {
  const res = await fetch(
    `${HORIZON_TESTNET}/accounts/${address}/payments?order=desc&limit=20`,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    _embedded?: { records?: HorizonPaymentRecord[] };
  };
  const records = data._embedded?.records ?? [];

  return records
    .filter(
      (r) =>
        r.type === 'payment' &&
        r.asset_code === 'USDC' &&
        r.asset_issuer === USDC_TESTNET_ISSUER,
    )
    .map((r) => {
      const isPositive = r.to === address;
      return {
        id: `pay-${r.id}`,
        title: isPositive ? 'USDC Received' : 'USDC Sent',
        displayAmount: `${isPositive ? '+' : '-'}${formatAmount(parseFloat(r.amount ?? '0'), 'USDC')}`,
        isPositive,
        dateIso: r.created_at,
      };
    });
}

export default function RecentTransactions() {
  const { ready, authenticated } = usePrivy();
  const { trades, loading } = useTradeHistory();
  const walletAddress = useStore((state) => state.user.walletAddress);
  // Keyed by address so one account's transfers never leak into another's view.
  const [transfers, setTransfers] = useState<{ address: string; items: ActivityItem[] } | null>(null);

  useEffect(() => {
    if (!authenticated || !walletAddress) return;
    let active = true;
    fetchUsdcTransfers(walletAddress)
      .then((items) => { if (active) setTransfers({ address: walletAddress, items }); })
      .catch(() => { /* Horizon unavailable — trades still render */ });
    return () => { active = false; };
  }, [authenticated, walletAddress]);

  const transferItems =
    transfers && transfers.address === walletAddress ? transfers.items : [];

  const transactions = [...trades.map(mapTrade), ...transferItems]
    .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime())
    .slice(0, 5);
  const isEmpty = transactions.length === 0;

  if (!ready || loading) return null;

  // Activity is per-account data — never render it for logged-out visitors.
  if (!authenticated) {
    return (
      <section className="mt-6">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-500">
          Recent Activity
        </h3>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center">
          <Lock className="mx-auto mb-2 size-5 text-gray-300" aria-hidden />
          <p className="text-sm font-medium text-gray-700">Sign in to see your activity</p>
          <p className="mt-1 text-xs text-gray-400">
            Your trade history is private to your account
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-500">
          Recent Activity
        </h3>
        {!isEmpty && (
          <Link
            href="/orders"
            className="text-xs font-medium text-primary-700 hover:text-primary-800 transition-colors"
          >
            View all →
          </Link>
        )}
      </div>

      {isEmpty ? (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center">
          <p className="text-sm font-medium text-gray-700">No recent activity</p>
          <p className="mt-1 text-xs text-gray-400">
            Make your first trade to see it here
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <CircleDollarSign className="h-5 w-5 shrink-0 text-[#4F46E5]" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.title}</p>
                  <p className="text-xs text-gray-400">{formatDate(tx.dateIso)}</p>
                </div>
              </div>
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm font-semibold text-gray-900 tabular-nums">
                {tx.displayAmount}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
