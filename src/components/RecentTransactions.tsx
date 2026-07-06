'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, CircleDollarSign, Lock } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useTradeHistory, CompletedTrade } from '@/contexts/TradeHistoryContext';
import { useStore } from '@/lib/store';
import { useLanguage } from '@/contexts/LanguageContext';

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

function formatDate(iso: string, lang: string): string {
  return new Date(iso).toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', {
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

function mapTrade(trade: CompletedTrade, t: (k: 'home.usdcPurchase' | 'home.usdcSale') => string): ActivityItem {
  const isPositive = trade.type === 'buy';
  return {
    id: trade.id,
    title: isPositive ? t('home.usdcPurchase') : t('home.usdcSale'),
    displayAmount: `${isPositive ? '+' : '-'}${formatAmount(trade.amount, 'USDC')}`,
    isPositive,
    dateIso: trade.date,
  };
}

// On-chain USDC transfers (Send/Receive) read straight from Horizon, so
// activity reflects reality even for payments made outside this app.
async function fetchUsdcTransfers(address: string, t: (k: 'home.usdcReceived' | 'home.usdcSent') => string): Promise<ActivityItem[]> {
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
        title: isPositive ? t('home.usdcReceived') : t('home.usdcSent'),
        displayAmount: `${isPositive ? '+' : '-'}${formatAmount(parseFloat(r.amount ?? '0'), 'USDC')}`,
        isPositive,
        dateIso: r.created_at,
      };
    });
}

const COLLAPSED_COUNT = 5;

export default function RecentTransactions() {
  const { t, lang } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const { ready, authenticated } = usePrivy();
  const { trades, loading } = useTradeHistory();
  const walletAddress = useStore((state) => state.user.walletAddress);
  // Keyed by address so one account's transfers never leak into another's view.
  const [transfers, setTransfers] = useState<{ address: string; items: ActivityItem[] } | null>(null);

  useEffect(() => {
    if (!authenticated || !walletAddress) return;
    let active = true;
    fetchUsdcTransfers(walletAddress, t)
      .then((items) => { if (active) setTransfers({ address: walletAddress, items }); })
      .catch(() => { /* Horizon unavailable — trades still render */ });
    return () => { active = false; };
  }, [authenticated, walletAddress, t]);

  const transferItems =
    transfers && transfers.address === walletAddress ? transfers.items : [];

  const allTransactions = [...trades.map((tr) => mapTrade(tr, t)), ...transferItems]
    .sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());
  const transactions = showAll ? allTransactions : allTransactions.slice(0, COLLAPSED_COUNT);
  const hasMore = allTransactions.length > COLLAPSED_COUNT;
  const isEmpty = allTransactions.length === 0;

  if (!ready || loading) return null;

  // Activity is per-account data — never render it for logged-out visitors.
  if (!authenticated) {
    return (
      <section className="mt-6">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-500">
          {t('home.recentActivity')}
        </h3>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center">
          <Lock className="mx-auto mb-2 size-5 text-gray-300" aria-hidden />
          <p className="text-sm font-medium text-gray-700">{t('home.signInToSee')}</p>
          <p className="mt-1 text-xs text-gray-400">
            {t('home.activityPrivate')}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.5px] text-gray-500">
          {t('home.recentActivity')}
        </h3>
        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            className="flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-800 transition-colors"
          >
            {showAll ? t('home.viewLess') : t('home.viewAll')}
            <ChevronDown
              className={`size-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-8 text-center">
          <p className="text-sm font-medium text-gray-700">{t('home.noActivity')}</p>
          <p className="mt-1 text-xs text-gray-400">
            {t('home.makeFirstTrade')}
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
                  <p className="text-xs text-gray-400">{formatDate(tx.dateIso, lang)}</p>
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
