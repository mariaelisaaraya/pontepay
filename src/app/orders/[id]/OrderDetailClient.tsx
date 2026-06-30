'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { loadChainOrderByIdFromContract } from '@/lib/p2p';
import { chainToUiOrder } from '@/lib/order-mapper';
import { useStore } from '@/lib/store';
import EscrowStepper from './EscrowStepper';
import type { P2POrderStatus, UiOrder } from '@/types';

// Maps the on-chain order status to the escrow stepper position.
const STATUS_STEP: Record<P2POrderStatus, number> = {
  Created: 1,
  AwaitingFiller: 1,
  AwaitingPayment: 2,
  AwaitingConfirmation: 3,
  Completed: 4,
  Disputed: 3,
  Refunded: 1,
  Cancelled: 1,
};

function shorten(addr?: string | null): string {
  if (!addr) return '—';
  return addr.length <= 12 ? addr : `${addr.slice(0, 5)}…${addr.slice(-5)}`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-[family-name:var(--font-dm-sans)] text-[15px] text-gray-900">{label}</span>
      <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900 tabular-nums">
        {children}
      </span>
    </div>
  );
}

export interface OrderDetailClientProps {
  orderId: string;
}

export default function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const router = useRouter();
  const walletAddress = useStore((s) => s.user.walletAddress);
  const [order, setOrder] = useState<UiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadChainOrderByIdFromContract(orderId)
      .then((chain) => {
        if (active) {
          setOrder(chainToUiOrder(chain));
          setError(null);
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Order not found on-chain');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-gray-500">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading order…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <p className="text-sm text-gray-500">{error ?? 'Order not found on-chain.'}</p>
        <button
          type="button"
          onClick={() => router.push('/marketplace')}
          className="rounded-xl bg-primary-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to marketplace
        </button>
      </div>
    );
  }

  const step = STATUS_STEP[order.status] ?? 1;
  const isOwn = !!walletAddress && walletAddress === order.createdBy;
  const canTake = order.status === 'AwaitingFiller' && !isOwn;

  // Take this order through the REAL on-chain flow.
  const handleTrade = () => {
    const mode = order.type === 'sell' ? 'buy' : 'sell';
    const amount = order.remainingAmount.toFixed(2);
    const flowId = crypto.randomUUID();
    router.push(
      `/trade/confirm?flowId=${encodeURIComponent(flowId)}&fillUsdc=${amount}&intentUsdc=${amount}&mode=${mode}&orderId=${encodeURIComponent(order.id)}`,
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
        >
          <ArrowLeft className="size-5 text-gray-900" />
        </button>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-gray-900">
          Order #{order.id}
        </h2>
        <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
          {order.status}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="my-5">
          <EscrowStepper currentStep={step} orderStatus={order.status} />
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-neutral-300 bg-white p-4">
          <Row label="Type">
            <span className={order.type === 'sell' ? 'text-green-600' : 'text-primary-800'}>
              {order.type === 'sell' ? 'Selling USDC' : 'Buying USDC'}
            </span>
          </Row>
          <Row label="Amount">{order.totalAmount.toLocaleString('en-US')} USDC</Row>
          <Row label="Available">{order.remainingAmount.toLocaleString('en-US')} USDC</Row>
          <Row label="Rate">
            {order.rate.toLocaleString('en-US')} {order.fiatCurrencyLabel}/USDC
          </Row>
          <Row label="Payment">{order.paymentMethodLabel}</Row>
          <Row label="Creator">
            {shorten(order.createdBy)}
            {isOwn ? ' (you)' : ''}
          </Row>
          <Row label="Filler">{shorten(order.filler)}</Row>
          <Row label="Network">Stellar Testnet</Row>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Live on-chain data read from the p2p Soroban contract.
        </p>
      </div>

      {canTake && (
        <div className="p-4 pb-6">
          <button
            type="button"
            onClick={handleTrade}
            className="h-14 w-full rounded-2xl bg-primary-700 font-[family-name:var(--font-space-grotesk)] text-base font-bold text-white shadow-lg shadow-primary-700/25 transition-all hover:bg-primary-800 active:scale-[0.98]"
          >
            {order.type === 'sell' ? 'Buy USDC' : 'Sell USDC'}
          </button>
        </div>
      )}
    </div>
  );
}
