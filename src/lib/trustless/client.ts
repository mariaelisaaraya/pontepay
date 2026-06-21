// Trustless Work escrow client for PeerlyPay.
//
// Flow for every write op:
//   POST /api/tw/<path> → { unsignedTransaction } → sign with Privy → POST /api/tw/helper/send-transaction
//
// The /api/tw proxy (src/app/api/tw/[...path]/route.ts) injects the x-api-key server-side.
// Never call dev.api.trustlesswork.com directly from the browser.

import type {
  InitializeSingleReleaseEscrowPayload,
  FundEscrowPayload,
  ChangeMilestoneStatusPayload,
  ApproveMilestonePayload,
  ReleaseFundsPayload,
  StartDisputePayload,
  ResolveDisputePayload,
  UnsignedTxResponse,
} from './types';
import type { PrivyStellarWallet } from '../privy-wallet';

async function proxyPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/tw/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T;
  return data;
}

async function signAndSubmit(
  wallet: PrivyStellarWallet,
  res: UnsignedTxResponse,
): Promise<UnsignedTxResponse> {
  if (!res.unsignedTransaction) {
    throw new Error(`TW error: ${res.message ?? 'no unsignedTransaction returned'}`);
  }
  const signedXdr = await wallet.signEscrowXdr(res.unsignedTransaction);
  return proxyPost<UnsignedTxResponse>('helper/send-transaction', {
    signedTransaction: signedXdr,
  });
}

export async function deployEscrow(
  wallet: PrivyStellarWallet,
  payload: InitializeSingleReleaseEscrowPayload,
): Promise<{ contractId: string }> {
  const res = await proxyPost<UnsignedTxResponse & { contractId?: string }>(
    'deployer/single-release',
    payload,
  );
  if (!res.contractId) throw new Error('TW deploy did not return contractId');
  await signAndSubmit(wallet, res);
  return { contractId: res.contractId };
}

export async function fundEscrow(
  wallet: PrivyStellarWallet,
  payload: FundEscrowPayload,
): Promise<void> {
  const res = await proxyPost<UnsignedTxResponse>('escrow/fund-escrow', payload);
  await signAndSubmit(wallet, res);
}

export async function changeMilestoneStatus(
  wallet: PrivyStellarWallet,
  payload: ChangeMilestoneStatusPayload,
): Promise<void> {
  const res = await proxyPost<UnsignedTxResponse>('escrow/change-milestone-status', payload);
  await signAndSubmit(wallet, res);
}

export async function approveMilestone(
  wallet: PrivyStellarWallet,
  payload: ApproveMilestonePayload,
): Promise<void> {
  const res = await proxyPost<UnsignedTxResponse>('escrow/approve-milestone', payload);
  await signAndSubmit(wallet, res);
}

export async function releaseFunds(
  wallet: PrivyStellarWallet,
  payload: ReleaseFundsPayload,
): Promise<void> {
  const res = await proxyPost<UnsignedTxResponse>('escrow/release-funds', payload);
  await signAndSubmit(wallet, res);
}

export async function disputeEscrow(
  wallet: PrivyStellarWallet,
  payload: StartDisputePayload,
): Promise<void> {
  const res = await proxyPost<UnsignedTxResponse>('escrow/dispute-escrow', payload);
  await signAndSubmit(wallet, res);
}

// ELI: resolveDispute must be signed by the PLATFORM key (PLATFORM_SECRET env var),
// NOT the user's browser wallet. This should be a server action that reads PLATFORM_SECRET
// and signs the XDR server-side. Client stub kept here for API completeness.
export async function resolveDispute(
  wallet: PrivyStellarWallet,
  payload: ResolveDisputePayload,
): Promise<void> {
  const res = await proxyPost<UnsignedTxResponse>('escrow/resolve-dispute', payload);
  await signAndSubmit(wallet, res);
}
