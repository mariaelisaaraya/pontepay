'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Loader2, CheckCircle2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { useStellarWallet } from '@/lib/privy-wallet';
import {
  defindexDeposit,
  defindexWithdraw,
  defindexGetBalance,
  defindexGetApy,
  DefindexDemoModeError,
} from '@/lib/defindex';

type ActionStep =
  | { status: 'idle' }
  | { status: 'loading'; label: string }
  | { status: 'success'; label: string }
  | { status: 'demo'; message: string }
  | { status: 'error'; message: string };

export default function EarnCard() {
  const { wallet, address, isReady } = useStellarWallet();

  const [apy, setApy] = useState<number | null>(null);
  const [balance, setBalance] = useState<{ dfTokens: string; usdcValue: string } | null>(null);
  const [apyLoading, setApyLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [step, setStep] = useState<ActionStep>({ status: 'idle' });

  useEffect(() => {
    let active = true;
    defindexGetApy()
      .then((val) => { if (active) setApy(val); })
      .catch(() => { if (active) setApy(4.2); })
      .finally(() => { if (active) setApyLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!address) return;
    let active = true;
    setBalanceLoading(true);
    defindexGetBalance(address)
      .then((val) => { if (active) setBalance(val); })
      .catch(() => { if (active) setBalance({ dfTokens: '0', usdcValue: '0' }); })
      .finally(() => { if (active) setBalanceLoading(false); });
    return () => { active = false; };
  }, [address]);

  async function handleDeposit() {
    if (!wallet) return;
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    try {
      setStep({ status: 'loading', label: 'Sign the deposit in your wallet…' });
      await defindexDeposit(wallet, amount);

      setStep({ status: 'success', label: 'Deposit confirmed!' });
      setDepositAmount('');
      if (address) {
        defindexGetBalance(address)
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
      setStep({ status: 'loading', label: 'Sign the withdrawal in your wallet…' });
      await defindexWithdraw(wallet, amount);

      setStep({ status: 'success', label: 'Withdrawal confirmed!' });
      setWithdrawAmount('');
      if (address) {
        defindexGetBalance(address)
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
          Earn with DeFindex
        </h3>
        {!apyLoading && apy !== null && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-semibold text-lime-700">
            <CheckCircle2 className="size-3" /> {apy.toFixed(1)}% APY
          </span>
        )}
        {apyLoading && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400">
            <Loader2 className="size-3 animate-spin" /> Loading…
          </span>
        )}
      </div>

      <div className="mb-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-gray-400">Vault</span>
          <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-gray-500">
            USDC · Stellar testnet
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-gray-400">Your balance</span>
          {!isReady ? (
            <span className="text-[13px] text-gray-400">Connect wallet</span>
          ) : balanceLoading ? (
            <span className="flex items-center gap-1 text-[13px] text-gray-400">
              <Loader2 className="size-3 animate-spin" /> Loading…
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

      {step.status === 'idle' && (
        <>
          {isReady ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="USDC amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowDownToLine className="size-3.5" /> Deposit
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="USDC amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowUpFromLine className="size-3.5" /> Withdraw
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-gray-400">Connect your wallet to deposit or withdraw.</p>
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
            Done
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
            Back
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
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
