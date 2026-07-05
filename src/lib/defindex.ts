'use client';

import type { PrivyStellarWallet } from '@/lib/privy-wallet';
import { sorobanSubmit } from '@/lib/soroban-submit';

const STROOPS_PER_USDC = 10_000_000;

function toStroops(usdc: number): number {
  return Math.round(usdc * STROOPS_PER_USDC);
}

export class DefindexDemoModeError extends Error {
  constructor(message = 'DeFindex is in demo mode: set DEFINDEX_API_KEY to enable this action') {
    super(message);
    this.name = 'DefindexDemoModeError';
  }
}

// Never sign a transaction the server flagged as demo or that has no XDR.
function extractSignableXdr(data: { xdr?: string; demo?: boolean; error?: string }): string {
  if (data.demo) {
    throw new DefindexDemoModeError(data.error);
  }
  if (!data.xdr) {
    throw new Error('DeFindex response did not include a transaction to sign');
  }
  return data.xdr;
}

export async function defindexDeposit(
  wallet: PrivyStellarWallet,
  amountUsdc: number,
  userAddress: string = wallet.address,
): Promise<void> {
  const res = await fetch('/api/defindex/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: toStroops(amountUsdc), userAddress }),
  });

  const data = (await res.json().catch(() => ({}))) as { xdr?: string; demo?: boolean; error?: string };

  if (data.demo) {
    throw new DefindexDemoModeError(data.error);
  }
  if (!res.ok) {
    throw new Error(data.error ?? `Deposit request failed (${res.status})`);
  }

  const xdr = extractSignableXdr(data);

  await sorobanSubmit(
    { toXDR: () => xdr },
    (unsigned) => wallet.signEscrowXdr(unsigned),
  );
}

export async function defindexWithdraw(
  wallet: PrivyStellarWallet,
  amountUsdc: number,
  userAddress: string = wallet.address,
): Promise<void> {
  const res = await fetch('/api/defindex/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: toStroops(amountUsdc), userAddress }),
  });

  const data = (await res.json().catch(() => ({}))) as { xdr?: string; demo?: boolean; error?: string };

  if (data.demo) {
    throw new DefindexDemoModeError(data.error);
  }
  if (!res.ok) {
    throw new Error(data.error ?? `Withdraw request failed (${res.status})`);
  }

  const xdr = extractSignableXdr(data);

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
