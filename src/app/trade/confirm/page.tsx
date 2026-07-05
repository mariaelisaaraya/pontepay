'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmTradeIcon from '@/components/icons/ConfirmTradeIcon';
import DemoBanner from '@/components/DemoBanner';
import { useStellarWallet } from '@/lib/stellar/privy-wallet';
import { takeOrder } from '@/lib/trade/trade-actions';
import { loadChainOrderByIdFromContract } from '@/lib/trade/p2p';
import { useLiveRate } from '@/lib/rates/useLiveRate';
import { useStore } from '@/lib/store';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { getFeeTier } from '@/lib/rates/pricing';
import { fetchUsdcTrustlineInfo } from '@/lib/stellar/wallet-balance';

function formatUsdc(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatFiatCompact(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wallet, address: stellarAddress } = useStellarWallet();
  const walletAddress = useStore((state) => state.user.walletAddress) ?? stellarAddress;
  const refreshOrdersFromChain = useStore((state) => state.refreshOrdersFromChain);
  const balanceUsdc = useStore((state) => state.user.balance.usdc);
  const [isChecking, setIsChecking] = useState(false);
  const liveRate = useLiveRate();
  const { t } = useLanguage();

  const flowId = searchParams.get('flowId') || '';
  const fillUsdc = parseFloat(searchParams.get('fillUsdc') || searchParams.get('amount') || '100');
  const intentUsdc = parseFloat(searchParams.get('intentUsdc') || searchParams.get('requestedAmount') || String(fillUsdc));
  const mode = (searchParams.get('mode') || 'sell') as 'sell' | 'buy';
  const orderId = searchParams.get('orderId') || '';
  const isDemo = searchParams.get('demo') === '1' || orderId.startsWith('demo-') || !orderId;
  const isSell = mode === 'sell';

  const rate = liveRate.usdArs;
  const fiatAmount = fillUsdc * rate;
  const tier = getFeeTier(fillUsdc);
  const feeRate = tier.spreadBps / 10_000;
  const feeArs = fillUsdc * feeRate * rate;
  const feeUsdc = fillUsdc * feeRate;
  const receiveArs = isSell ? fiatAmount - feeArs : fiatAmount;
  const receiveUsdc = isSell ? fillUsdc : fillUsdc - feeUsdc;

  const sendLabel = isSell ? `${formatUsdc(fillUsdc)} USDC` : `~${formatFiatCompact(fiatAmount)} ARS`;
  const receiveLabel = isSell ? `~${formatFiatCompact(receiveArs)} ARS` : `${formatUsdc(receiveUsdc)} USDC`;
  const isAdjustedAmount = Math.abs(intentUsdc - fillUsdc) > 0.0001;

  const handleConfirm = useCallback(async () => {
    // Demo mode: walk the real screens without any on-chain write.
    if (isDemo) {
      const params = `flowId=${encodeURIComponent(flowId)}&fillUsdc=${fillUsdc}&intentUsdc=${intentUsdc}&mode=${mode}&orderId=${encodeURIComponent(orderId)}&demo=1`;
      router.push(mode === 'buy' ? `/trade/payment?${params}` : `/trade/waiting?${params}`);
      return;
    }

    if (!walletAddress) {
      toast.error('Connect wallet first');
      return;
    }

    if (!orderId) {
      toast.error('No order selected');
      return;
    }

    // Selling escrows the user's own USDC — block fills beyond their balance
    // before asking for a signature the contract would reject anyway.
    if (mode === 'sell' && fillUsdc > balanceUsdc + 1e-7) {
      toast.error(
        `Insufficient balance: you have ${balanceUsdc.toFixed(2)} USDC but this trade needs ${fillUsdc.toFixed(2)} USDC`,
      );
      return;
    }

    setIsChecking(true);

    try {
      const { hasTrustline } = await fetchUsdcTrustlineInfo(walletAddress);
      if (!hasTrustline) {
        router.push(`/trade/enable-usdc?flowId=${encodeURIComponent(flowId)}&fillUsdc=${fillUsdc}&intentUsdc=${intentUsdc}&mode=${mode}&orderId=${orderId}`);
        return;
      }

      // Pattern #2: live re-read before signing — shinigami pattern.
      // Read the on-chain order status right before calling takeOrder so we
      // catch a race where another taker filled the order between the user
      // landing on this screen and confirming. Skip for demo/numeric-id guard.
      if (!orderId.startsWith('demo-') && /^\d+$/.test(orderId)) {
        const liveOrder = await loadChainOrderByIdFromContract(orderId);
        if (liveOrder.status !== 'AwaitingFiller') {
          toast.error(t('trade.orderTaken'));
          router.back();
          return;
        }
      }

      if (!wallet) throw new Error('Wallet not ready');
      await takeOrder({
        wallet,
        caller: walletAddress,
        orderId,
        fillAmount: fillUsdc,
      });

      await refreshOrdersFromChain();

      if (mode === 'buy') {
        router.push(`/trade/payment?flowId=${encodeURIComponent(flowId)}&fillUsdc=${fillUsdc}&intentUsdc=${intentUsdc}&mode=${mode}&orderId=${orderId}`);
      } else {
        router.push(`/trade/waiting?flowId=${encodeURIComponent(flowId)}&fillUsdc=${fillUsdc}&intentUsdc=${intentUsdc}&mode=${mode}&orderId=${orderId}`);
      }
    } catch (error) {
      console.error('Failed to take order', error);
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('balance') || msg.includes('underflow') || msg.includes('Underfunded')) {
        toast.error(t('trade.insufficientBalance'));
      } else {
        toast.error(t('trade.failedTake'));
      }
    } finally {
      setIsChecking(false);
    }
  }, [balanceUsdc, fillUsdc, flowId, intentUsdc, isDemo, mode, orderId, refreshOrdersFromChain, router, t, wallet, walletAddress, stellarAddress]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {isDemo && <DemoBanner />}
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center size-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="size-5 text-gray-900" />
        </button>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-gray-900">
          {isSell ? t('trade.confirmSale') : t('trade.confirmPurchase')}
        </h2>
      </div>

      <div className="flex-1 px-4 pb-4 flex flex-col items-center overflow-y-auto">
        {/* Trade Icon */}
        <div className="mt-8 mb-8">
          <ConfirmTradeIcon />
        </div>

        {/* Trade Summary */}
        <div className="w-full rounded-md border border-neutral-400 bg-white p-4 flex flex-col gap-3">
          {isAdjustedAmount && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Requested {formatUsdc(intentUsdc)} USDC, this swap executes {formatUsdc(fillUsdc)} USDC.
            </p>
          )}
          {/* You send */}
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-dm-sans)] text-[15px] text-gray-900">{t('trade.youSend')}</span>
            <span className="flex items-center gap-0.5 font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900 tabular-nums">
              <ArrowUpCircle className="size-4 text-gray-900" />
              {sendLabel}
            </span>
          </div>

          {/* You receive */}
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-dm-sans)] text-[15px] text-gray-900">{t('trade.youReceive')}</span>
            <span className="flex items-center gap-0.5 font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900 tabular-nums">
              <ArrowDownCircle className="size-4 text-gray-900" />
              {receiveLabel}
            </span>
          </div>

          {/* Exchange rate (live: Reflector oracle / BCRA) */}
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-dm-sans)] text-[15px] text-gray-900">{t('trade.rate')}</span>
            <span className="flex items-center gap-1.5 font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900 tabular-nums">
              1 USD ≈ {formatFiatCompact(rate)} ARS
              <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
                {liveRate.source === 'contract' || liveRate.source === 'reflector'
                  ? 'oracle'
                  : liveRate.source}
              </span>
            </span>
          </div>

          {/* Platform fee */}
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-dm-sans)] text-[15px] text-gray-900">{t('trade.fee')}</span>
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] tabular-nums">
              {tier.spreadBps === 0 ? (
                <span className="text-green-600">0% {tier.label}</span>
              ) : (
                <span className="text-gray-900">{(feeRate * 100).toFixed(1)}% · {tier.label}</span>
              )}
            </span>
          </div>

          {/* Network */}
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-dm-sans)] text-[15px] text-gray-900">{t('trade.network')}</span>
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900">Stellar</span>
          </div>

          {/* Estimated time */}
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-dm-sans)] text-[15px] text-gray-900">{t('trade.estimatedTime')}</span>
            <span className="flex items-center gap-0.5 font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900 tabular-nums">
              <Clock className="size-4 text-gray-900" />
              2-10 mins
            </span>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="p-4 pb-6">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isChecking}
          className={cn(
            'w-full h-14 rounded-2xl font-[family-name:var(--font-space-grotesk)] text-base font-bold text-white transition-all active:scale-[0.98]',
            isChecking
              ? 'bg-primary-700/70 cursor-wait'
              : 'bg-primary-700 shadow-lg shadow-primary-700/25 hover:bg-primary-800'
          )}
        >
          {isChecking ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              Checking wallet...
            </span>
          ) : (
            t('trade.confirmTrade')
          )}
        </button>
      </div>
    </div>
  );
}

export default function TradeConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">Loading...</div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
