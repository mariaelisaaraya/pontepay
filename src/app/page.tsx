'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useTradeHistory } from '@/contexts/TradeHistoryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import BalanceCard from '@/components/BalanceCard';
import QuickActions from '@/components/QuickActions';
import HowItWorks from '@/components/HowItWorks';
import RecentTransactions from '@/components/RecentTransactions';

export default function RootPage() {
  const { trades } = useTradeHistory();
  const { t } = useLanguage();

  const hasCompletedTrades = trades.length > 0;

  return (
    <>
      <BalanceCard />
      <QuickActions />

      <Link
        href="/corridor"
        className="flex w-full items-center gap-3 rounded-2xl border border-[#014A2D]/20 bg-white p-4 cursor-pointer mt-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/br.svg" alt="Brazil" className="size-10 shrink-0 object-contain" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#014A2D]">
            {t('home.sendToBrazil')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t('home.sendToBrazilDesc')}
          </p>
        </div>
        <ChevronRight className="size-5 text-gray-400 ml-auto shrink-0" />
      </Link>

      {!hasCompletedTrades && <HowItWorks />}
      <RecentTransactions />
    </>
  );
}
