'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Chain config ─────────────────────────────────────────────────────────────

const CHAINS = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    logo: '🔷',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    explorer: 'https://etherscan.io',
    bridge: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    estimatedMinutes: 15,
  },
  {
    id: 'base',
    name: 'Base',
    logo: '🔵',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    explorer: 'https://basescan.org',
    bridge: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    estimatedMinutes: 3,
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    logo: '🟦',
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    explorer: 'https://arbiscan.io',
    bridge: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    estimatedMinutes: 5,
  },
  {
    id: 'polygon',
    name: 'Polygon',
    logo: '🟣',
    usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    explorer: 'https://polygonscan.com',
    bridge: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    estimatedMinutes: 7,
  },
];

// Stellar testnet USDC issuer
const STELLAR_USDC_ISSUER = 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU';
const STELLAR_USDC_SHORT = `${STELLAR_USDC_ISSUER.slice(0, 8)}…${STELLAR_USDC_ISSUER.slice(-4)}`;

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = 'select' | 'confirm' | 'bridging' | 'done';

// ─── Component ────────────────────────────────────────────────────────────────

export default function BridgePage() {
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState<Stage>('select');
  const [simulatedTxId] = useState(`0x${Math.random().toString(16).slice(2, 18)}`);

  const chain = CHAINS.find((c) => c.id === selectedChain);
  const parsedAmount = parseFloat(amount) || 0;
  const fee = parsedAmount > 0 ? Math.max(0.5, parsedAmount * 0.001) : 0;
  const youReceive = parsedAmount > 0 ? parsedAmount - fee : 0;

  function handleConfirm() {
    if (!chain || parsedAmount <= 0) return;
    setStage('confirm');
  }

  function handleBridge() {
    setStage('bridging');
    // Simulate 4-second bridge
    setTimeout(() => setStage('done'), 4000);
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (stage === 'done') {
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="flex flex-col items-center gap-4 pt-8 pb-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">Bridge complete</p>
            <p className="mt-1 text-sm text-gray-500">
              {fmt(youReceive)} USDC arrived on your Stellar wallet
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
          <Row label="From" value={`${chain?.logo} ${chain?.name}`} />
          <Row label="Amount sent" value={`${fmt(parsedAmount)} USDC`} />
          <Row label="Bridge fee" value={`${fmt(fee)} USDC`} />
          <Row label="Received on Stellar" value={`${fmt(youReceive)} USDC`} mono />
          <Row label="CCTP Tx" value={`${simulatedTxId.slice(0, 12)}…`} mono />
          <Row label="Protocol" value="Circle CCTP v2" />
        </div>

        <a
          href={`${chain?.explorer}/tx/${simulatedTxId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View on {chain?.name} explorer <ExternalLink className="size-4" />
        </a>

        <Link
          href="/"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-500)] py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-600)]"
        >
          Back to home
        </Link>
      </div>
    );
  }

  // ── Bridging ──────────────────────────────────────────────────────────────
  if (stage === 'bridging') {
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
          <Loader2 className="size-8 animate-spin text-indigo-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">Bridging via Circle CCTP</p>
          <p className="mt-1 text-sm text-gray-500">
            Burning USDC on {chain?.name} and minting on Stellar…
          </p>
          <p className="mt-3 text-xs text-gray-400">Est. {chain?.estimatedMinutes} min</p>
        </div>
        <div className="w-full max-w-xs space-y-3 text-left">
          {['Locking USDC on source chain', 'Circle attestation', 'Minting on Stellar'].map(
            (step, i) => (
              <div key={step} className="flex items-center gap-3 text-sm">
                <Loader2
                  className={cn(
                    'size-4 shrink-0',
                    i === 0 ? 'animate-spin text-indigo-500' : 'text-gray-300',
                  )}
                />
                <span className={i === 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                  {step}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  // ── Confirm ───────────────────────────────────────────────────────────────
  if (stage === 'confirm') {
    return (
      <div className="px-4 py-6 space-y-5">
        <button
          type="button"
          onClick={() => setStage('select')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-gray-900">
          Confirm bridge
        </h1>

        {/* Route visual */}
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl">{chain?.logo}</span>
            <span className="text-[11px] font-medium text-gray-600">{chain?.name}</span>
          </div>
          <ArrowRight className="size-5 text-gray-400 flex-1" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl">✦</span>
            <span className="text-[11px] font-medium text-gray-600">Stellar</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
          <Row label="You send" value={`${fmt(parsedAmount)} USDC`} />
          <Row label="Bridge fee (0.1%)" value={`${fmt(fee)} USDC`} />
          <Row label="You receive" value={`${fmt(youReceive)} USDC`} highlight />
          <Row label="Destination" value={STELLAR_USDC_SHORT} mono />
          <Row label="Protocol" value="Circle CCTP v2" />
          <Row label="Est. time" value={`~${chain?.estimatedMinutes} min`} />
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
          <Info className="size-4 shrink-0 mt-0.5" />
          <span>
            This demo simulates Circle CCTP. In production, your EVM wallet signs the burn transaction on {chain?.name} and USDC is minted natively on Stellar — no wrapping or custodians.
          </span>
        </div>

        <button
          type="button"
          onClick={handleBridge}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all"
        >
          <ArrowLeftRight className="size-4" />
          Bridge {fmt(parsedAmount)} USDC to Stellar
        </button>
      </div>
    );
  }

  // ── Select (default) ──────────────────────────────────────────────────────
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profile" className="flex items-center text-gray-500 hover:text-gray-800">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-gray-900">
            Bridge USDC
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Powered by Circle CCTP v2</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3 text-[12px] text-indigo-700 leading-relaxed">
        <p className="font-semibold mb-0.5">How it works</p>
        <p className="opacity-80">
          Circle&apos;s Cross-Chain Transfer Protocol burns USDC on the source chain and mints
          native USDC on Stellar — no wrapped tokens, no bridges that can be hacked.
        </p>
      </div>

      {/* Source chain selector */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Source chain
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CHAINS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedChain(c.id)}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all active:scale-[0.97]',
                selectedChain === c.id
                  ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300',
              )}
            >
              <span className="text-2xl">{c.logo}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                <p className="text-[10px] text-gray-400">~{c.estimatedMinutes} min</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Amount input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Amount (USDC)
        </label>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 pr-16 text-lg font-semibold text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
            USDC
          </span>
        </div>
        {parsedAmount > 0 && (
          <p className="text-xs text-gray-500 px-1">
            Fee {fmt(fee)} USDC → you receive{' '}
            <span className="font-semibold text-gray-900">{fmt(youReceive)} USDC</span> on Stellar
          </p>
        )}
      </div>

      {/* Destination */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Destination
        </label>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-xl">✦</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Stellar (your Privy wallet)</p>
            <p className="font-mono text-[10px] text-gray-400">{STELLAR_USDC_SHORT}</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selectedChain || parsedAmount <= 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
      >
        <ArrowLeftRight className="size-4" />
        {selectedChain && parsedAmount > 0
          ? `Bridge ${fmt(parsedAmount)} USDC from ${chain?.name}`
          : 'Select chain and amount'}
      </button>

      <a
        href="https://www.circle.com/en/cross-chain-transfer-protocol"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600"
      >
        Learn about Circle CCTP <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Row({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={cn(
          'text-sm font-semibold',
          mono && 'font-mono text-xs',
          highlight ? 'text-emerald-700' : 'text-gray-900',
        )}
      >
        {value}
      </span>
    </div>
  );
}
