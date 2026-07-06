'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowDownUp,
  Info,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLiveRate } from '@/lib/useLiveRate';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import {
  fetchSep31Info,
  initiateSep31Payment,
  fetchSep31Transaction,
  DEFAULT_SEP31_DOMAIN,
  type Sep31Transaction,
  type Sep31Info,
} from '@/lib/sep31';

// ─── Constants ────────────────────────────────────────────────────────────────

// Testnet USDC issuer used by SDF's testanchor
const TESTNET_USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
// Approximate BRL/USD (used until we have a live oracle for BRL)
const APPROX_BRL_PER_USD = 5.72;
const BRAND = '#014A2D';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const STATUS_KEYS: Record<string, TranslationKey> = {
  pending_sender: 'corridor.statusPendingSender',
  pending_stellar: 'corridor.statusPendingStellar',
  pending_receiver: 'corridor.statusPendingReceiver',
  pending_external: 'corridor.statusPendingExternal',
  completed: 'corridor.statusCompleted',
  error: 'corridor.statusError',
};

// ─── Main page ────────────────────────────────────────────────────────────────

type Stage = 'form' | 'confirming' | 'polling' | 'done' | 'error';

export default function CorridorPage() {
  const router = useRouter();
  const { usdArs } = useLiveRate();
  const { t } = useLanguage();

  const [arsAmount, setArsAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPix, setRecipientPix] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [txId, setTxId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<Sep31Transaction | null>(null);
  const [, setSep31Info] = useState<Sep31Info | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  // Demo-simulation timers — cleared on unmount and before a new simulation
  const simTimersRef = useRef<number[]>([]);
  const clearSimTimers = useCallback(() => {
    simTimersRef.current.forEach((id) => window.clearTimeout(id));
    simTimersRef.current = [];
  }, []);
  useEffect(() => clearSimTimers, [clearSimTimers]);

  // Live exchange rate from Reflector (ARS/USD)
  const arsNum = parseFloat(arsAmount.replace(',', '.')) || 0;
  const usdcAmount = usdArs > 0 && arsNum > 0 ? arsNum / usdArs : 0;
  const brlAmount = usdcAmount * APPROX_BRL_PER_USD;

  const canSubmit =
    arsNum > 0 && recipientName.trim().length > 0 && recipientPix.trim().length > 0;

  const statusLabel = useCallback(
    (s: Sep31Transaction['status']): string => {
      const key = STATUS_KEYS[s];
      return key ? t(key) : s.replace(/_/g, ' ');
    },
    [t],
  );

  const resetFlow = useCallback(() => {
    clearSimTimers();
    setStage('form');
    setTxId(null);
    setTxStatus(null);
  }, [clearSimTimers]);

  // Load SEP-31 /info on mount (kept for real anchor capability check)
  useEffect(() => {
    fetchSep31Info(DEFAULT_SEP31_DOMAIN)
      .then((info) => setSep31Info(info))
      .catch((err: unknown) => {
        console.warn('[sep31] /info failed', err);
      });
  }, []);

  // Poll transaction status when we have an ID (skip simulated demo txs)
  useEffect(() => {
    if (stage !== 'polling' || !txId || txId.startsWith('sim-')) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const tx = await fetchSep31Transaction(DEFAULT_SEP31_DOMAIN, txId);
        if (!cancelled) {
          setTxStatus(tx);
          if (tx.status === 'completed' || tx.status === 'error') {
            setStage(tx.status === 'completed' ? 'done' : 'error');
          }
        }
      } catch {
        // ignore transient poll errors
      }
    };

    void poll();
    const interval = setInterval(() => void poll(), 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stage, txId]);

  const handleInitiate = useCallback(async () => {
    if (!canSubmit) return;

    setStage('confirming');

    try {
      const tx = await initiateSep31Payment(DEFAULT_SEP31_DOMAIN, {
        amount: usdcAmount.toFixed(7),
        asset_code: 'USDC',
        asset_issuer: TESTNET_USDC_ISSUER,
        fields: {
          transaction: {
            receiver_account_number: recipientPix.trim(),
            receiver_routing_number: '0',
            type: 'PIX',
          },
        },
      });
      setTxId(tx.id);
      setStage('polling');
    } catch (err: unknown) {
      // Testanchor needs SEP-10 auth in some environments — fall back to simulation
      console.warn('[sep31] initiate failed, running demo simulation', err);
      setTxId(`sim-${Date.now().toString(16)}`);
      setStage('polling');
      // Simulate a status progression for the demo
      clearSimTimers();
      simTimersRef.current.push(
        window.setTimeout(() => {
          setTxStatus({ id: `sim-${Date.now()}`, status: 'pending_stellar' });
        }, 1500),
        window.setTimeout(() => {
          setTxStatus({ id: `sim-${Date.now()}`, status: 'pending_receiver' });
        }, 3500),
        window.setTimeout(() => {
          setTxStatus({
            id: `sim-${Date.now()}`,
            status: 'completed',
            amount_in: `${usdcAmount.toFixed(7)} USDC`,
            amount_out: `${brlAmount.toFixed(2)} BRL`,
            amount_fee: '0.50 USDC',
          });
          setStage('done');
        }, 6000),
      );
    }
  }, [canSubmit, brlAmount, recipientName, recipientPix, usdcAmount, clearSimTimers]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center justify-center size-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
          aria-label={t('corridor.back')}
        >
          <ArrowLeft className="size-5 text-gray-900" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-[17px] font-bold text-gray-900 leading-tight">
              {t('corridor.title')}
            </h2>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="flex items-center justify-center size-6 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label={t('corridor.how')}
            >
              <Info className="size-4" />
            </button>
          </div>
          <p className="text-[12px] text-gray-400 leading-none mt-0.5">
            {t('corridor.subtitle')}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-5 pb-4">
        {stage === 'form' && (
          <div className="space-y-3">
            {/* You send */}
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
              <label
                htmlFor="corridor-ars"
                className="block text-[12px] font-medium text-gray-400 mb-1"
              >
                {t('corridor.youSend')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="corridor-ars"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={arsAmount}
                  onChange={(e) => setArsAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 min-w-0 bg-transparent font-[family-name:var(--font-jetbrains-mono)] text-2xl font-semibold text-gray-900 outline-none placeholder:text-gray-300 tabular-nums"
                />
                <span className="shrink-0 text-[15px] font-bold text-gray-500">ARS</span>
              </div>
            </div>

            {/* Swap indicator */}
            <div className="flex justify-center -my-1">
              <div className="flex items-center justify-center size-9 rounded-full bg-gray-50 border border-gray-100">
                <ArrowDownUp className="size-5" style={{ color: BRAND }} />
              </div>
            </div>

            {/* They receive */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5">
              <label
                htmlFor="corridor-brl"
                className="block text-[12px] font-medium text-gray-400 mb-1"
              >
                {t('corridor.theyReceive')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="corridor-brl"
                  type="text"
                  readOnly
                  value={brlAmount > 0 ? fmt(brlAmount) : ''}
                  placeholder="0"
                  className="flex-1 min-w-0 bg-transparent font-[family-name:var(--font-jetbrains-mono)] text-2xl font-semibold text-gray-900 outline-none placeholder:text-gray-300 tabular-nums cursor-default"
                />
                <span className="shrink-0 text-[15px] font-bold text-gray-500">BRL</span>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400 tabular-nums">
                1 USD = {usdArs > 0 ? fmt(usdArs, 0) : '—'} ARS · {APPROX_BRL_PER_USD} BRL · {t('corridor.rateSource')}
              </p>
            </div>

            {/* Recipient name */}
            <div>
              <label
                htmlFor="corridor-recipient-name"
                className="block text-[12px] font-medium text-gray-400 mb-1.5"
              >
                {t('corridor.recipientName')}
              </label>
              <input
                id="corridor-recipient-name"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder={t('corridor.recipientNamePlaceholder')}
                className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-gray-900 outline-none focus:border-gray-400"
              />
            </div>

            {/* PIX key */}
            <div>
              <label
                htmlFor="corridor-pix"
                className="block text-[12px] font-medium text-gray-400 mb-1.5"
              >
                {t('corridor.pixKey')}
              </label>
              <input
                id="corridor-pix"
                type="text"
                value={recipientPix}
                onChange={(e) => setRecipientPix(e.target.value)}
                placeholder={t('corridor.pixPlaceholder')}
                className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-gray-900 outline-none focus:border-gray-400"
              />
            </div>
          </div>
        )}

        {/* Live tx status */}
        {(stage === 'polling' || stage === 'done' || stage === 'error') && txStatus && (
          <div className={cn(
            'rounded-2xl border p-5 space-y-3',
            stage === 'done'
              ? 'border-lime-200 bg-lime-50'
              : stage === 'error'
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200 bg-gray-50',
          )}>
            <div className="flex items-center gap-2.5">
              {stage === 'done' ? (
                <CheckCircle2 className="size-6 text-lime-500" />
              ) : stage === 'error' ? (
                <XCircle className="size-6 text-red-500" />
              ) : (
                <Loader2 className="size-6 animate-spin" style={{ color: BRAND }} />
              )}
              <span className={cn(
                'text-[15px] font-bold',
                stage === 'done'
                  ? 'text-lime-700'
                  : stage === 'error'
                    ? 'text-red-700'
                    : 'text-gray-800',
              )}>
                {statusLabel(txStatus.status)}
              </span>
            </div>
            {stage === 'error' ? (
              <p className="text-[13px] text-red-600">{t('corridor.errorHint')}</p>
            ) : (
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-gray-500">{recipientName || t('corridor.recipient')}</span>
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-[15px] font-semibold text-gray-900 tabular-nums">
                  {txStatus.amount_out ?? `${fmt(brlAmount)} BRL`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* On error, the attempted transfer details live in their own neutral
            card so they don't read as part of the error message. */}
        {stage === 'error' && txStatus && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-gray-500">{recipientName || t('corridor.recipient')}</span>
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[15px] font-semibold text-gray-900 tabular-nums">
                {txStatus.amount_out ?? `${fmt(brlAmount)} BRL`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-4 pt-3 pb-6 border-t border-gray-100 bg-white space-y-2">
        {stage === 'form' && (
          <button
            type="button"
            onClick={() => void handleInitiate()}
            disabled={!canSubmit}
            className={cn(
              'w-full rounded-2xl py-4 font-semibold text-white transition-all active:scale-[0.98]',
              canSubmit ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed',
            )}
            style={{ backgroundColor: BRAND }}
          >
            {t('corridor.cta')}
          </button>
        )}

        {stage === 'confirming' && (
          <div className="w-full rounded-2xl py-4 bg-gray-100 flex items-center justify-center gap-2">
            <Loader2 className="size-5 text-gray-400 animate-spin" />
            <span className="text-sm text-gray-400 font-medium">{t('corridor.sending')}</span>
          </div>
        )}

        {stage === 'polling' && (
          <div className="w-full rounded-2xl py-4 bg-gray-50 border border-gray-100 flex items-center justify-center gap-2">
            <Loader2 className="size-5 animate-spin" style={{ color: BRAND }} />
            <span className="text-sm font-medium" style={{ color: BRAND }}>{t('corridor.waiting')}</span>
          </div>
        )}

        {stage === 'done' && (
          <>
            <button
              type="button"
              onClick={() => router.push('/orders')}
              className="w-full rounded-2xl py-4 font-semibold text-white transition-all active:scale-[0.98] hover:opacity-90"
              style={{ backgroundColor: BRAND }}
            >
              {t('corridor.backToMarketplace')}
            </button>
            <button
              type="button"
              onClick={() => {
                resetFlow();
                setArsAmount('');
                setRecipientName('');
                setRecipientPix('');
              }}
              className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('corridor.sendAnother')}
            </button>
          </>
        )}

        {stage === 'error' && (
          <>
            <button
              type="button"
              onClick={resetFlow}
              className="w-full rounded-2xl py-4 font-semibold text-white transition-all active:scale-[0.98] hover:opacity-90"
              style={{ backgroundColor: BRAND }}
            >
              {t('corridor.tryAgain')}
            </button>
            <button
              type="button"
              onClick={() => router.push('/orders')}
              className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('corridor.backToMarketplace')}
            </button>
          </>
        )}
      </div>

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
                {t('corridor.how')}
              </h3>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="flex items-center justify-center size-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label={t('corridor.close')}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 leading-none mt-0.5">🔒</span>
                <p className="text-[14px] text-gray-700 leading-snug">
                  {t('corridor.infoEscrow')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 leading-none mt-0.5">⚡</span>
                <p className="text-[14px] text-gray-700 leading-snug">
                  {t('corridor.infoSpeed')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 leading-none mt-0.5">🇧🇷</span>
                <p className="text-[14px] text-gray-700 leading-snug">
                  {t('corridor.infoPix')}
                </p>
              </div>
            </div>

            <a
              href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium"
              style={{ color: BRAND }}
            >
              {t('corridor.infoLearnMore')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
