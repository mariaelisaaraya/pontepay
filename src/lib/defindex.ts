'use client';

import type { PrivyStellarWallet } from '@/lib/privy-wallet';
import { sorobanSubmit } from '@/lib/soroban-submit';

const STROOPS_PER_USDC = 10_000_000;

function toStroops(usdc: number): number {
  return Math.round(usdc * STROOPS_PER_USDC);
}

export async function defindexDeposit(wallet: PrivyStellarWallet, amountUsdc: number): Promise<void> {
  const res = await fetch('/api/defindex/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: toStroops(amountUsdc), userAddress: wallet.address }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Deposit request failed (${res.status})`);
  }

  const { xdr } = (await res.json()) as { xdr: string };

  await sorobanSubmit(
    { toXDR: () => xdr },
    (unsigned) => wallet.signEscrowXdr(unsigned),
  );
}

export async function defindexWithdraw(wallet: PrivyStellarWallet, amountUsdc: number): Promise<void> {
  const res = await fetch('/api/defindex/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: toStroops(amountUsdc), userAddress: wallet.address }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Withdraw request failed (${res.status})`);
  }

  const { xdr } = (await res.json()) as { xdr: string };

  await sorobanSubmit(
    { toXDR: () => xdr },
    (unsigned) => wallet.signEscrowXdr(unsigned),
  );
}

export async function defindexGetBalance(
  address: string,
): Promise<{ dfTokens: string; usdcValue: string }> {
  const res = await fetch(`/api/defindex/balance?address=${encodeURIComponent(address)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Balance request failed (${res.status})`);
  }
  return res.json() as Promise<{ dfTokens: string; usdcValue: string }>;
}

export async function defindexGetApy(): Promise<number> {
  const res = await fetch('/api/defindex/apy');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `APY request failed (${res.status})`);
  }
  const data = (await res.json()) as { apy: number };
  return data.apy;
}
