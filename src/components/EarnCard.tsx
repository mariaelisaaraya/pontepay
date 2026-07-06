'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TrendingUp, Loader2, CheckCircle2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useStellarWallet } from '@/lib/privy-wallet';
import { useStore } from '@/lib/store';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  defindexDeposit,
  defindexWithdraw,
  defindexGetBalance,
  DefindexDemoModeError,
} from '@/lib/defindex';

type ActionStep =
  | { status: 'idle' }
  | { status: 'loading'; label: string }
  | { status: 'success'; label: string }
  | { status: 'demo'; message: string }
  | { status: 'error'; message: string };

export default function EarnCard() {
  const { t } = useLanguage();
  const { wallet, address } = useStellarWallet();
  // Local-keypair wallets resolve their address asynchronously into the store
  // (see WalletButton) — the hook returns address:null for them, so fall back.
  const storeAddress = useStore((s) => s.user.walletAddress);
  const effectiveAddress = address ?? storeAddress ?? null;
  const walletReady = Boolean(wallet && effectiveAddress);

  const [apy, setApy] = useState<number | null>(null);
  const [balance, setBalance] = useState<{ dfTokens: string; usdcValue: string } | null>(null);
  const [apyLoading, setApyLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [step, setStep] = useState<ActionStep>({ status: 'idle' });
  const [showWhere, setShowWhere] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/defindex/apy')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data) => {
        if (!active) return;
        // Endpoint returns a flat { apy: number }; guard for a nested shape too.
        const raw = typeof data?.apy === 'number' ? data.apy : data?.apy?.apy;
        setApy(typeof raw === 'number' && Number.isFinite(raw) ? raw : null);
      })
      .catch(() => { if (active) setApy(null); })
      .finally(() => { if (active) setApyLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!effectiveAddress) return;
    let active = true;
    defindexGetBalance(effectiveAddress)
      .then((val) => { if (active) setBalance(val); })
      .catch(() => { if (active) setBalance({ dfTokens: '0', usdcValue: '0' }); })
    return () => { active = false; };
  }, [effectiveAddress]);

  // Loading = wallet connected but the first balance fetch hasn't resolved yet
  // (both .then and .catch above set a non-null balance).
  const balanceLoading = !!effectiveAddress && balance === null;

  async function handleDeposit() {
    if (!wallet) return;
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    try {
      setStep({ status: 'loading', label: t('earn.signDeposit') });
      await defindexDeposit(wallet, amount, effectiveAddress ?? undefined);

      setStep({ status: 'success', label: t('earn.depositConfirmed') });
      setDepositAmount('');
      if (effectiveAddress) {
        defindexGetBalance(effectiveAddress)
          .then(setBalance)
          .catch(() => {});
      }
    } catch (e) {
      if (e instanceof DefindexDemoModeError) {
        setStep({ status: 'demo', message: e.message });
        return;
      }
      setStep({ status: 'error', message: e instanceof Error ? e.message : 'Deposit failed' });
    }
  }

  async function handleWithdraw() {
    if (!wallet) return;
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return;
    try {
      setStep({ status: 'loading', label: t('earn.signWithdraw') });
      await defindexWithdraw(wallet, amount, effectiveAddress ?? undefined);

      setStep({ status: 'success', label: t('earn.withdrawConfirmed') });
      setWithdrawAmount('');
      if (effectiveAddress) {
        defindexGetBalance(effectiveAddress)
          .then(setBalance)
          .catch(() => {});
      }
    } catch (e) {
      if (e instanceof DefindexDemoModeError) {
        setStep({ status: 'demo', message: e.message });
        return;
      }
      setStep({ status: 'error', message: e instanceof Error ? e.message : 'Withdraw failed' });
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="size-5 text-primary-500" />
        <h3 className="font-[family-name:var(--font-space-grotesk)] text-base font-bold text-gray-900">
          {t('earn.cardTitle')}
        </h3>
        {!apyLoading && apy !== null && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-semibold text-lime-700">
            <CheckCircle2 className="size-3" /> {apy.toFixed(2)}% APY
          </span>
        )}
        {apyLoading && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400 animate-pulse">
            <Loader2 className="size-3 animate-spin" /> — % APY
          </span>
        )}
        {!apyLoading && apy === null && (
          <span className="ml-auto inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400">
            {t('earn.apyUnavailable')}
          </span>
        )}
      </div>

      <div className="mb-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-gray-400">{t('earn.vault')}</span>
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-gray-500">
            USDC · Stellar testnet
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-gray-400">{t('earn.yourBalance')}</span>
          {!walletReady ? (
            <span className="text-[13px] text-gray-400">{t('earn.connectWallet')}</span>
          ) : balanceLoading ? (
            <span className="flex items-center gap-1 text-[13px] text-gray-400">
              <Loader2 className="size-3 animate-spin" /> {t('earn.loading')}
            </span>
          ) : (
            <span className="text-[13px] font-semibold text-gray-900">
              {balance ? parseFloat(balance.usdcValue).toFixed(2) : '0.00'} USDC
            </span>
          )}
        </div>

        {balance && parseFloat(balance.dfTokens) > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-gray-400">dfTokens</span>
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-[13px] text-gray-600">
              {parseFloat(balance.dfTokens).toFixed(6)}
            </span>
          </div>
        )}
      </div>

      {/* Plain-language explainer: where the deposited money actually lives */}
      <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50">
        <button
          type="button"
          onClick={() => setShowWhere((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[13px] font-medium text-gray-600 hover:text-gray-800"
        >
          {t('earn.whereTitle')}
          <ChevronDown className={`size-4 text-gray-400 transition-transform ${showWhere ? 'rotate-180' : ''}`} />
        </button>
        {showWhere && (
          <div className="px-3 pb-3 text-[12px] leading-relaxed text-gray-500">
            {t('earn.whereBody')}{' '}
            <a
              href="https://stellar.expert/explorer/testnet/contract/CD3XC44CDLM6L6H4TIB5FIXP262P3O26433ACYZ7N2T2Z65IFMEWQADP"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary-600 underline"
            >
              {t('earn.viewVault')}
            </a>
          </div>
        )}
      </div>

      {step.status === 'idle' && (
        <>
          {walletReady ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t('earn.usdcAmount')}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowDownToLine className="size-3.5" /> {t('earn.deposit')}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t('earn.usdcAmount')}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowUpFromLine className="size-3.5" /> {t('earn.withdraw')}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-gray-400">{t('earn.connectToDeposit')}</p>
          )}
        </>
      )}

      {step.status === 'loading' && (
        <div className="flex items-center gap-2 pt-2 text-[13px] text-gray-500">
          <Loader2 className="size-4 animate-spin text-primary-500" />
          {step.label}
        </div>
      )}

      {step.status === 'success' && (
        <div className="pt-2 space-y-2">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-lime-700">
            <CheckCircle2 className="size-4" /> {step.label}
          </p>
          <button
            onClick={() => setStep({ status: 'idle' })}
            className="text-[12px] text-gray-400 underline hover:text-gray-600"
          >
            {t('earn.done')}
          </button>
        </div>
      )}

      {step.status === 'demo' && (
        <div className="pt-2 space-y-1">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
            {step.message}
          </p>
          <button
            onClick={() => setStep({ status: 'idle' })}
            className="text-[12px] text-gray-400 underline hover:text-gray-600"
          >
            {t('earn.back')}
          </button>
        </div>
      )}

      {step.status === 'error' && (
        <div className="pt-2 space-y-1">
          <p className="text-[13px] text-red-500">{step.message}</p>
          <button
            onClick={() => setStep({ status: 'idle' })}
            className="text-[12px] text-gray-400 underline hover:text-gray-600"
          >
            {t('earn.tryAgain')}
          </button>
        </div>
      )}
    </div>
  );
}
