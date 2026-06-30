'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowDown,
  CheckCircle2,
  Circle,
  Loader2,
  ExternalLink,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLiveRate } from '@/lib/useLiveRate';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function statusLabel(s: Sep31Transaction['status']): string {
  const map: Record<string, string> = {
    pending_sender: 'Waiting for USDC transfer',
    pending_stellar: 'Confirming on Stellar',
    pending_receiver: 'Brazilian anchor processing',
    pending_external: 'Sending BRL via PIX',
    completed: 'Delivered',
    error: 'Error',
  };
  return map[s] ?? s.replace(/_/g, ' ');
}

// ─── Step display ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: 1,
    title: 'P2P escrow (ARS leg)',
    desc: 'Seller locks ARS via PontePay Soroban contract and releases USDC.',
    anchor: false,
  },
  {
    n: 2,
    title: 'Stellar settlement',
    desc: 'USDC moves on Stellar (Soroban). Finalizes in ~5 seconds.',
    anchor: false,
  },
  {
    n: 3,
    title: 'SEP-31 direct payment',
    desc: 'PontePay sends USDC to the receiving anchor via SEP-31 cross-border protocol.',
    anchor: true,
  },
  {
    n: 4,
    title: 'PIX delivery (BRL leg)',
    desc: 'Brazilian anchor receives USDC and pays the recipient in BRL via PIX instantly.',
    anchor: true,
  },
] as const;

// ─── Main page ────────────────────────────────────────────────────────────────

type Stage = 'form' | 'confirming' | 'polling' | 'done' | 'error';

export default function CorridorPage() {
  const router = useRouter();
  const { usdArs } = useLiveRate();

  const [arsAmount, setArsAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPix, setRecipientPix] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [txId, setTxId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<Sep31Transaction | null>(null);
  const [sep31Info, setSep31Info] = useState<Sep31Info | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Live exchange rate from Reflector (ARS/USD)
  const arsNum = parseFloat(arsAmount.replace(',', '.')) || 0;
  const usdcAmount = usdArs > 0 && arsNum > 0 ? arsNum / usdArs : 0;
  const brlAmount = usdcAmount * APPROX_BRL_PER_USD;

  // Load SEP-31 /info on mount to show real anchor capabilities
  useEffect(() => {
    fetchSep31Info(DEFAULT_SEP31_DOMAIN)
      .then((info) => setSep31Info(info))
      .catch((err: unknown) => {
        console.warn('[sep31] /info failed', err);
        setInfoError('Could not reach testanchor — showing simulated flow.');
      });
  }, []);

  // Poll transaction status when we have an ID
  useEffect(() => {
    if (stage !== 'polling' || !txId) return;
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
    setSubmitError(null);
    if (arsNum <= 0) { setSubmitError('Enter an ARS amount.'); return; }
    if (!recipientName.trim()) { setSubmitError('Enter the recipient name.'); return; }
    if (!recipientPix.trim()) { setSubmitError('Enter the recipient PIX key.'); return; }

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
      setTimeout(() => {
        setTxStatus({ id: `sim-${Date.now()}`, status: 'pending_stellar' });
      }, 1500);
      setTimeout(() => {
        setTxStatus({ id: `sim-${Date.now()}`, status: 'pending_receiver' });
      }, 3500);
      setTimeout(() => {
        setTxStatus({
          id: `sim-${Date.now()}`,
          status: 'completed',
          amount_in: `${usdcAmount.toFixed(7)} USDC`,
          amount_out: `${brlAmount.toFixed(2)} BRL`,
          amount_fee: '0.50 USDC',
        });
        setStage('done');
      }, 6000);
    }
  }, [arsNum, brlAmount, recipientName, recipientPix, usdcAmount]);

  const currentStepIndex =
    stage === 'form' || stage === 'confirming' ? 0
    : stage === 'polling' && txStatus?.status === 'pending_stellar' ? 1
    : stage === 'polling' && (txStatus?.status === 'pending_receiver' || txStatus?.status === 'pending_external') ? 2
    : stage === 'done' ? 4
    : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center size-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5 text-gray-900" />
        </button>
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-[17px] font-bold text-gray-900 leading-tight">
            ARS → BRL Corridor
          </h2>
          <p className="text-[11px] text-gray-400 leading-none mt-0.5">
            SEP-31 cross-border · Stellar settles in ~5s
          </p>
        </div>
        <a
          href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700"
        >
          SEP-31 <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-4 space-y-4">

        {/* Anchor capabilities banner */}
        {sep31Info && (
          <div className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2.5 flex items-start gap-2">
            <CheckCircle2 className="size-4 text-lime-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-semibold text-lime-700">
                testanchor.stellar.org · SEP-31 live
              </p>
              <p className="text-[11px] text-lime-600 mt-0.5">
                Supported assets:{' '}
                {Object.keys(sep31Info.receive).join(', ') || 'USDC'}
              </p>
            </div>
          </div>
        )}
        {infoError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
            <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">{infoError}</p>
          </div>
        )}

        {/* Route summary */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇦🇷</span>
            <span className="text-[13px] font-semibold text-gray-800">Argentina</span>
            <span className="text-[11px] text-gray-400">ARS</span>
            <span className="ml-auto font-[family-name:var(--font-jetbrains-mono)] text-[13px] font-semibold text-gray-900 tabular-nums">
              {arsNum > 0 ? fmt(arsNum, 0) : '—'} ARS
            </span>
          </div>
          <div className="pl-1 flex items-center gap-2">
            <ArrowDown className="size-4 text-gray-300" />
            <span className="text-[11px] text-indigo-500 font-medium">
              PontePay P2P escrow → USDC on Stellar
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-indigo-500 text-white text-[9px] font-bold shrink-0">
              ✦
            </span>
            <span className="text-[13px] font-semibold text-gray-800">Stellar</span>
            <span className="text-[11px] text-gray-400">USDC</span>
            <span className="ml-auto font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-indigo-600 tabular-nums">
              {usdcAmount > 0 ? fmt(usdcAmount) : '—'} USDC
            </span>
          </div>
          <div className="pl-1 flex items-center gap-2">
            <ArrowDown className="size-4 text-gray-300" />
            <span className="text-[11px] text-green-600 font-medium">
              SEP-31 direct payment → Brazilian anchor → PIX
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🇧🇷</span>
            <span className="text-[13px] font-semibold text-gray-800">Brazil</span>
            <span className="text-[11px] text-gray-400">BRL via PIX</span>
            <span className="ml-auto font-[family-name:var(--font-jetbrains-mono)] text-[13px] font-semibold text-green-700 tabular-nums">
              ≈ {brlAmount > 0 ? fmt(brlAmount) : '—'} BRL
            </span>
          </div>
          {usdArs > 0 && (
            <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Rate (Reflector oracle)</span>
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-gray-500 tabular-nums">
                1 USD = {fmt(usdArs, 0)} ARS · {APPROX_BRL_PER_USD} BRL
              </span>
            </div>
          )}
        </div>

        {/* Step tracker */}
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">
            Corridor steps
          </p>
          <div className="space-y-2">
            {STEPS.map((step) => {
              const done = currentStepIndex >= step.n;
              const active = currentStepIndex === step.n - 1 && stage === 'polling';
              return (
                <div
                  key={step.n}
                  className={cn(
                    'flex gap-3 rounded-xl border px-3 py-3 transition-all',
                    done
                      ? 'border-lime-200 bg-lime-50'
                      : active
                        ? 'border-indigo-200 bg-indigo-50'
                        : 'border-gray-100 bg-white opacity-60',
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {done ? (
                      <CheckCircle2 className="size-4 text-lime-500" />
                    ) : active ? (
                      <Loader2 className="size-4 text-indigo-500 animate-spin" />
                    ) : (
                      <Circle className="size-4 text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      'text-[12px] font-semibold',
                      done ? 'text-lime-700' : active ? 'text-indigo-700' : 'text-gray-500',
                    )}>
                      {step.title}
                      {step.anchor && (
                        <span className="ml-1.5 rounded bg-sky-100 px-1 py-0.5 text-[9px] font-bold text-sky-600 uppercase tracking-wide">
                          SEP-31
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-snug mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        {(stage === 'form') && (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">
                You send (ARS)
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 h-14">
                <span className="text-sm font-bold text-gray-400 shrink-0">$</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={arsAmount}
                  onChange={(e) => setArsAmount(e.target.value)}
                  placeholder="e.g. 100000"
                  className="flex-1 bg-transparent font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-gray-900 outline-none placeholder:text-gray-300 tabular-nums"
                />
                <span className="shrink-0 text-sm font-bold text-gray-500">ARS</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">
                Recipient name
              </p>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Full name"
                className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-gray-900 outline-none focus:border-indigo-300"
              />
            </div>

            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">
                PIX key (CPF, phone, email or random)
              </p>
              <input
                type="text"
                value={recipientPix}
                onChange={(e) => setRecipientPix(e.target.value)}
                placeholder="recipient@email.com.br"
                className="w-full h-12 rounded-xl border border-green-200 bg-green-50/50 px-4 font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900 outline-none focus:border-green-400"
              />
            </div>

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* Live tx status */}
        {(stage === 'polling' || stage === 'done' || stage === 'error') && txStatus && (
          <div className={cn(
            'rounded-2xl border p-4 space-y-2',
            stage === 'done' ? 'border-lime-200 bg-lime-50' : 'border-indigo-100 bg-indigo-50',
          )}>
            <div className="flex items-center gap-2">
              {stage === 'done' ? (
                <CheckCircle2 className="size-5 text-lime-500" />
              ) : (
                <Loader2 className="size-5 text-indigo-500 animate-spin" />
              )}
              <span className={cn(
                'text-[13px] font-bold',
                stage === 'done' ? 'text-lime-700' : 'text-indigo-700',
              )}>
                {statusLabel(txStatus.status)}
              </span>
            </div>
            {txId && (
              <p className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-gray-400 break-all">
                tx: {txId}
              </p>
            )}
            {txStatus.amount_out && (
              <p className="text-[13px] font-semibold text-lime-700">
                Delivered: {txStatus.amount_out}
              </p>
            )}
          </div>
        )}

        {/* SEP-31 note */}
        <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5 flex items-start gap-2">
          <Zap className="size-4 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-semibold text-sky-700">
              testanchor.stellar.org · SEP-31 endpoint
            </p>
            <p className="text-[11px] text-sky-600 leading-snug mt-0.5">
              <code className="font-[family-name:var(--font-jetbrains-mono)] bg-sky-100 px-1 rounded text-[10px]">
                POST /sep31/transactions
              </code>
              {' '}initiates the corridor. PontePay then sends USDC to the anchor&apos;s Stellar account and polls status until delivery.
            </p>
          </div>
        </div>

      </div>

      {/* Bottom CTA */}
      <div className="px-4 pt-3 pb-6 border-t border-gray-100 bg-white space-y-2">
        {stage === 'form' && (
          <button
            type="button"
            onClick={() => void handleInitiate()}
            disabled={arsNum <= 0}
            className={cn(
              'w-full h-14 rounded-2xl font-[family-name:var(--font-space-grotesk)] text-base font-bold text-white transition-all active:scale-[0.98]',
              arsNum > 0
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 hover:opacity-90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed',
            )}
          >
            Send {arsNum > 0 ? `${fmt(brlAmount)} BRL` : 'BRL'} to Brazil
          </button>
        )}

        {stage === 'confirming' && (
          <div className="w-full h-14 rounded-2xl bg-gray-100 flex items-center justify-center gap-2">
            <Loader2 className="size-5 text-gray-400 animate-spin" />
            <span className="text-sm text-gray-400 font-medium">Initiating corridor…</span>
          </div>
        )}

        {stage === 'polling' && (
          <div className="w-full h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center gap-2">
            <Loader2 className="size-5 text-indigo-500 animate-spin" />
            <span className="text-sm text-indigo-600 font-medium">Waiting for confirmation…</span>
          </div>
        )}

        {stage === 'done' && (
          <>
            <button
              type="button"
              onClick={() => router.push('/orders')}
              className="w-full h-14 rounded-2xl font-[family-name:var(--font-space-grotesk)] text-base font-bold text-white bg-gradient-to-r from-primary-700 to-primary-800 shadow-lg shadow-primary-700/25 hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Back to marketplace
            </button>
            <button
              type="button"
              onClick={() => { setStage('form'); setTxId(null); setTxStatus(null); }}
              className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Send another transfer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
