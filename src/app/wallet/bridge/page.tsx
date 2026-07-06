'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStellarWallet } from '@/lib/privy-wallet';
import { useLanguage } from '@/contexts/LanguageContext';

const BRAND = '#014A2D';

// ─── Chain config ─────────────────────────────────────────────────────────────

const CHAINS = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    logo: '🔷',
    logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    explorer: 'https://etherscan.io',
    bridge: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    estimatedMinutes: 15,
  },
  {
    id: 'base',
    name: 'Base',
    logo: '🔵',
    logoUrl: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    explorer: 'https://basescan.org',
    bridge: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    estimatedMinutes: 3,
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    logo: '🟦',
    logoUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.svg',
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    explorer: 'https://arbiscan.io',
    bridge: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    estimatedMinutes: 5,
  },
  {
    id: 'polygon',
    name: 'Polygon',
    logo: '🟣',
    logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.svg',
    usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    explorer: 'https://polygonscan.com',
    bridge: 'https://www.circle.com/en/cross-chain-transfer-protocol',
    estimatedMinutes: 7,
  },
];

// Stellar testnet USDC issuer
const STELLAR_USDC_ISSUER = 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU';
const STELLAR_USDC_SHORT = `${STELLAR_USDC_ISSUER.slice(0, 8)}…${STELLAR_USDC_ISSUER.slice(-4)}`;

// Fee floor: fee = max(MIN_BRIDGE_FEE, amount * 0.1%), so any amount at or
// below MIN_BRIDGE_FEE would yield a zero or negative receive.
const MIN_BRIDGE_FEE = 0.5;

function makeSimulatedTxId() {
  // Two random draws concatenated, then normalized to exactly 16 hex chars
  // (a single Math.random().toString(16) can yield very few digits).
  const hex =
    Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  return `0x${hex.padEnd(16, '0').slice(0, 16)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = 'select' | 'confirm' | 'bridging' | 'done';

// ─── Component ────────────────────────────────────────────────────────────────

export default function BridgePage() {
  const { t } = useLanguage();
  const { address: stellarAddress } = useStellarWallet();
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState<Stage>('select');
  const [infoOpen, setInfoOpen] = useState(false);
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});
  const [simulatedTxId] = useState(makeSimulatedTxId);
  const bridgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the simulated-bridge timer if the page unmounts mid-flight.
  useEffect(() => {
    return () => {
      if (bridgeTimerRef.current) clearTimeout(bridgeTimerRef.current);
    };
  }, []);

  const walletShort = stellarAddress
    ? `${stellarAddress.slice(0, 6)}…${stellarAddress.slice(-4)}`
    : t('bridge.yourPrivyWallet');

  const chain = CHAINS.find((c) => c.id === selectedChain);
  const parsedAmount = parseFloat(amount) || 0;
  const fee = parsedAmount > 0 ? Math.max(MIN_BRIDGE_FEE, parsedAmount * 0.001) : 0;
  const youReceive = parsedAmount > 0 ? parsedAmount - fee : 0;
  const amountTooLow = parsedAmount > 0 && youReceive <= 0;

  function handleConfirm() {
    if (!chain || youReceive <= 0) return;
    setStage('confirm');
  }

  function handleBridge() {
    setStage('bridging');
    // Simulate 4-second bridge
    bridgeTimerRef.current = setTimeout(() => setStage('done'), 4000);
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
            <p className="text-xl font-bold text-gray-900">{t('bridge.doneTitle')}</p>
            <p className="mt-1 text-sm text-gray-500">
              {fmt(youReceive)} USDC {t('bridge.doneArrived')}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
          <Row label={t('bridge.from')} value={`${chain?.logo} ${chain?.name}`} />
          <Row label={t('bridge.amountSent')} value={`${fmt(parsedAmount)} USDC`} />
          <Row label={t('bridge.fee')} value={`${fmt(fee)} USDC`} />
          <Row label={t('bridge.receivedOnStellar')} value={`${fmt(youReceive)} USDC`} mono />
          <Row label="CCTP Tx" value={`${simulatedTxId.slice(0, 12)}…`} mono />
          <Row label={t('bridge.protocol')} value="Circle CCTP v2" />
        </div>

        <a
          href={`${chain?.explorer}/tx/${simulatedTxId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {t('bridge.viewExplorerBefore')} {chain?.name} {t('bridge.viewExplorerAfter')}{' '}
          <ExternalLink className="size-4" />
        </a>

        <Link
          href="/"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-500)] py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-600)]"
        >
          {t('bridge.backHome')}
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
          <p className="text-lg font-bold text-gray-900">{t('bridge.bridgingTitle')}</p>
          <p className="mt-1 text-sm text-gray-500">
            {t('bridge.burningBefore')} {chain?.name} {t('bridge.burningAfter')}
          </p>
          <p className="mt-3 text-xs text-gray-400">
            {t('bridge.estPrefix')} {chain?.estimatedMinutes} min
          </p>
        </div>
        <div className="w-full max-w-xs space-y-3 text-left">
          {[t('bridge.stepLock'), t('bridge.stepAttest'), t('bridge.stepMint')].map(
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
          <ArrowLeft className="size-4" /> {t('bridge.back')}
        </button>

        <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-gray-900">
          {t('bridge.confirmTitle')}
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
          <Row label={t('bridge.youSend')} value={`${fmt(parsedAmount)} USDC`} />
          <Row label={t('bridge.feePct')} value={`${fmt(fee)} USDC`} />
          <Row label={t('bridge.youReceive')} value={`${fmt(youReceive)} USDC`} highlight />
          <Row label={t('bridge.destination')} value={STELLAR_USDC_SHORT} mono />
          <Row label={t('bridge.protocol')} value="Circle CCTP v2" />
          <Row label={t('bridge.estTime')} value={`~${chain?.estimatedMinutes} min`} />
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
          <Info className="size-4 shrink-0 mt-0.5" />
          <span>
            {t('bridge.demoNoteBefore')} {chain?.name} {t('bridge.demoNoteAfter')}
          </span>
        </div>

        <button
          type="button"
          onClick={handleBridge}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all"
        >
          <ArrowLeftRight className="size-4" />
          {t('bridge.bridgePrefix')} {fmt(parsedAmount)} USDC {t('bridge.bridgeSuffix')}
        </button>
      </div>
    );
  }

  // ── Select (default) ──────────────────────────────────────────────────────
  const canBridge = !!selectedChain && youReceive > 0;

  return (
    <div className="relative px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex items-center text-gray-500 hover:text-gray-800"
          aria-label={t('bridge.back')}
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-gray-900">
            {t('bridge.title')}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{t('bridge.poweredBy')}</p>
        </div>
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          className="flex items-center justify-center size-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label={t('bridge.how')}
        >
          <Info className="size-5" />
        </button>
      </div>

      {/* Step 1 — Source chain */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-500">{t('bridge.from')}</span>
        <div className="grid grid-cols-2 gap-3">
          {CHAINS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedChain(c.id)}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.97]',
                selectedChain === c.id
                  ? 'border-2 border-[#014A2D] bg-[#014A2D]/5'
                  : 'border border-gray-200 bg-white hover:border-gray-300',
              )}
            >
              {failedLogos[c.id] ? (
                <span className="flex w-8 h-8 items-center justify-center text-2xl leading-none">
                  {c.logo}
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.logoUrl}
                  alt={c.name}
                  className="w-8 h-8 object-contain"
                  onError={() =>
                    setFailedLogos((prev) => ({ ...prev, [c.id]: true }))
                  }
                />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                <p className="text-[11px] text-gray-400">~{c.estimatedMinutes} min</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — Amount */}
      <div className="space-y-2">
        <label htmlFor="bridge-amount" className="block text-sm font-medium text-gray-500">
          {t('bridge.amountLabel')}
        </label>
        <div className="relative">
          <input
            id="bridge-amount"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-16 text-lg font-semibold text-gray-900 outline-none focus:border-[#014A2D]"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
            USDC
          </span>
        </div>
        {amountTooLow && (
          <p className="text-xs text-amber-600">
            {t('bridge.minHintBefore')} {fmt(MIN_BRIDGE_FEE)} USDC {t('bridge.minHintAfter')}
          </p>
        )}
      </div>

      {/* Step 3 — Destination (read-only) */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-500">{t('bridge.to')}</span>
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3.5">
          <span className="text-xl">✦</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{t('bridge.yourStellarWallet')}</p>
            <p className="font-mono text-[11px] text-gray-400 truncate">{walletShort}</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!canBridge}
        className="w-full rounded-2xl py-4 font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        style={{ backgroundColor: BRAND }}
      >
        {t('bridge.cta')}
      </button>

      {/* Info modal */}
      {infoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4"
          onClick={() => setInfoOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-[19px] font-bold text-gray-900">
                {t('bridge.how')}
              </h3>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="flex items-center justify-center size-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label={t('bridge.close')}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 leading-none mt-0.5">🔥</span>
                <p className="text-[14px] text-gray-700 leading-snug">
                  {t('bridge.infoBurn')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 leading-none mt-0.5">⚡</span>
                <p className="text-[14px] text-gray-700 leading-snug">
                  {t('bridge.infoMint')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 leading-none mt-0.5">✅</span>
                <p className="text-[14px] text-gray-700 leading-snug">
                  {t('bridge.infoArrive')}
                </p>
              </div>
            </div>

            <a
              href="https://www.circle.com/en/cross-chain-transfer-protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium"
              style={{ color: BRAND }}
            >
              {t('bridge.infoLearnMore')}
            </a>
          </div>
        </div>
      )}
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
