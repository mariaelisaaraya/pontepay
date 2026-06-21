'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmTradeIcon from '@/components/icons/ConfirmTradeIcon';
import { useStellarWallet } from '@/lib/privy-wallet';
import { takeOrder } from '@/lib/trade-actions';
import { useLiveRate } from '@/lib/useLiveRate';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

async function checkUSDCTrustline(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return true;
}

const FEE_RATE = 0.005;

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
  const [isChecking, setIsChecking] = useState(false);
  const liveRate = useLiveRate();

  const flowId = searchParams.get('flowId') || '';
  const fillUsdc = parseFloat(searchParams.get('fillUsdc') || searchParams.get('amount') || '100');
  const intentUsdc = parseFloat(searchParams.get('intentUsdc') || searchParams.get('requestedAmount') || String(fillUsdc));
  const mode = (searchParams.get('mode') || 'sell') as 'sell' | 'buy';
  const orderId = searchParams.get('orderId') || '';
  const isDemo = searchParams.get('demo') === '1';
  const isSell = mode === 'sell';

  const rate = liveRate.usdArs;
  const fiatAmount = fillUsdc * rate;
  const feeArs = fillUsdc * FEE_RATE * rate;
  const feeUsdc = fillUsdc * FEE_RATE;
  // Fee already deducted from receive amount
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

    setIsChecking(true);

    try {
      const hasTrustline = await checkUSDCTrustline();
      if (!hasTrustline) {
        router.push(`/trade/enable-usdc?flowId=${encodeURIComponent(flowId)}&fillUsdc=${fillUsdc}&intentUsdc=${intentUsdc}&mode=${mode}&orderId=${orderId}`);
        return;
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
      toast.error('Failed to take order');
    } finally {
      setIsChecking(false);
    }
  }, [fillUsdc, flowId, intentUsdc, isDemo, mode, orderId, refreshOrdersFromChain, router, wallet, walletAddress, stellarAddress]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
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
          {isSell ? 'Confirm Sale' : 'Confirm Purchase'}
        </h2>
      </div>

      <div className="flex-1 px-4 pb-4 flex flex-col items-center overflow-y-auto">
        {/* Trade Icon */}
        <div className="mt-8 mb-8">
          <ConfirmTradeIcon />
        </div>

        {isDemo && (
          <div className="mb-3 w-full rounded-md bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-700">
            Demo mode — walk the full flow without an on-chain transaction
          </div>
        )}

        {/* Trade Summary */}
        <div className="w-full rounded-md border border-neutral-400 bg-white p-4 flex flex-col gap-3">
          {isAdjustedAmount && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Requested {formatUsdc(intentUsdc)} USDC, this swap executes {formatUsdc(fillUsdc)} USDC.
            </p>
          )}
          {/* You send */}
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-dm-sans)] text-[15px] text-gray-900">You send</span>
            <span className="flex items-center gap-0.5 font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900 tabular-nums">
              <ArrowUpCircle className="size-4 text-gray-900" />
              {sendLabel}
            </span>
          </div>

          {/* You receive */}
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-dm-sans)] text-[15px] text-gray-900">You receive</span>
            <span className="flex items-center gap-0.5 font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900 tabular-nums">
              <ArrowDownCircle className="size-4 text-gray-900" />
              {receiveLabel}
            </span>
          </div>

          {/* Exchange rate (live: Reflector oracle / BCRA) */}
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-dm-sans)] text-[15px] text-gray-900">Rate</span>
            <span className="flex items-center gap-1.5 font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900 tabular-nums">
              1 USD ≈ {formatFiatCompact(rate)} ARS
              <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
                {liveRate.source === 'contract' || liveRate.source === 'reflector'
                  ? 'oracle'
                  : liveRate.source}
              </span>
            </span>
          </div>

          {/* Network */}
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-dm-sans)] text-[15px] text-gray-900">Network</span>
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900">Stellar</span>
          </div>

          {/* Estimated time */}
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-dm-sans)] text-[15px] text-gray-900">Estimated time</span>
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
              ? 'bg-magenta-500/70 cursor-wait'
              : 'bg-magenta-500 shadow-lg shadow-magenta-500/25 hover:bg-magenta-600'
          )}
        >
          {isChecking ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              Checking wallet...
            </span>
          ) : (
            'Confirm Trade'
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
