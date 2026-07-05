'use client';

import { useEffect, useState } from 'react';
import { Landmark, Loader2, CheckCircle2, ArrowDownToLine, ArrowUpFromLine, ExternalLink } from 'lucide-react';
import { useStellarWallet } from '@/lib/stellar/privy-wallet';
import {
  sep10GetChallenge,
  sep10SubmitChallenge,
  sep24StartDeposit,
  sep24StartWithdraw,
} from '@/lib/anchor/sep24';

interface AnchorInfo {
  domain: string;
  webAuthEndpoint: string | null;
  transferServer: string | null;
  signingKey: string | null;
  deposit: string[];
  withdraw: string[];
}

type Step =
  | { status: 'idle' }
  | { status: 'loading'; label: string }
  | { status: 'popup'; url: string }
  | { status: 'error'; message: string };

export default function AnchorCard() {
  const [info, setInfo] = useState<AnchorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>({ status: 'idle' });
  const { wallet } = useStellarWallet();

  useEffect(() => {
    let active = true;
    fetch('/api/anchor/info')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: AnchorInfo) => {
        if (active) setInfo(d);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Anchor unreachable');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function runFlow(action: 'deposit' | 'withdraw', assetCode: string) {
    if (!wallet) return;
    try {
      setStep({ status: 'loading', label: 'Requesting SEP-10 challenge…' });
      const challengeXdr = await sep10GetChallenge(wallet.address);

      setStep({ status: 'loading', label: 'Signing challenge with wallet…' });
      const signedXdr = await wallet.signEscrowXdr(challengeXdr);

      setStep({ status: 'loading', label: 'Authenticating with anchor…' });
      const jwt = await sep10SubmitChallenge(signedXdr);

      setStep({ status: 'loading', label: 'Opening anchor interface…' });
      const url =
        action === 'deposit'
          ? await sep24StartDeposit({ jwt, assetCode, account: wallet.address })
          : await sep24StartWithdraw({ jwt, assetCode, account: wallet.address });

      window.open(url, 'sep24', 'width=500,height=700,noopener,noreferrer');
      setStep({ status: 'popup', url });
    } catch (e) {
      setStep({ status: 'error', message: e instanceof Error ? e.message : 'Unknown error' });
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Landmark className="size-5 text-primary-500" />
        <h3 className="font-[family-name:var(--font-space-grotesk)] text-base font-bold text-gray-900">
          Fiat anchor (SEP-24)
        </h3>
        {info?.transferServer && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-semibold text-lime-700">
            <CheckCircle2 className="size-3" /> Connected
          </span>
        )}
      </div>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-4 animate-spin" /> Reading anchor capabilities…
        </p>
      )}

      {error && !loading && <p className="text-sm text-red-500">Could not reach anchor: {error}</p>}

      {info && !loading && (
        <div className="space-y-3 text-sm">
          <Field label="Anchor" value={info.domain} mono />
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">Deposit rails</p>
            <div className="flex flex-wrap gap-1">
              {info.deposit.length ? (
                info.deposit.map((c) => <Chip key={c}>{c}</Chip>)
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">Withdraw rails</p>
            <div className="flex flex-wrap gap-1">
              {info.withdraw.length ? (
                info.withdraw.map((c) => <Chip key={c}>{c}</Chip>)
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {info.webAuthEndpoint && <Chip>SEP-10 auth</Chip>}
            {info.transferServer && <Chip>SEP-24 transfer</Chip>}
          </div>

          {step.status === 'idle' && (
            <div className="pt-2">
              {wallet ? (
                <div className="flex gap-2">
                  {info.deposit.includes('USDC') && (
                    <button
                      onClick={() => runFlow('deposit', 'USDC')}
                      className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-[13px] font-semibold text-white hover:bg-primary-600 transition-colors"
                    >
                      <ArrowDownToLine className="size-3.5" /> Deposit USDC
                    </button>
                  )}
                  {info.withdraw.includes('USDC') && (
                    <button
                      onClick={() => runFlow('withdraw', 'USDC')}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <ArrowUpFromLine className="size-3.5" /> Withdraw USDC
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[12px] text-gray-400">Connect your wallet to deposit or withdraw.</p>
              )}
            </div>
          )}

          {step.status === 'loading' && (
            <div className="flex items-center gap-2 pt-2 text-[13px] text-gray-500">
              <Loader2 className="size-4 animate-spin text-primary-500" />
              {step.label}
            </div>
          )}

          {step.status === 'popup' && (
            <div className="pt-2 space-y-2">
              <p className="flex items-center gap-1.5 text-[13px] text-lime-700 font-semibold">
                <CheckCircle2 className="size-4" /> Anchor interface opened
              </p>
              <a
                href={step.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[12px] text-primary-500 hover:underline"
              >
                <ExternalLink className="size-3" /> Open again if popup was blocked
              </a>
              <button
                onClick={() => setStep({ status: 'idle' })}
                className="text-[12px] text-gray-400 hover:text-gray-600 underline"
              >
                Reset
              </button>
            </div>
          )}

          {step.status === 'error' && (
            <div className="pt-2 space-y-1">
              <p className="text-[13px] text-red-500">{step.message}</p>
              <button
                onClick={() => setStep({ status: 'idle' })}
                className="text-[12px] text-gray-400 hover:text-gray-600 underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className={mono ? 'font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-900' : 'text-[13px] text-gray-900'}>
        {value}
      </span>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
      {children}
    </span>
  );
}
