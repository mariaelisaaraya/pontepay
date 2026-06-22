// P2P trade actions — bridges the UI trade flow to Trustless Work escrow.
//
// ELI: createOrder() and takeOrder() are stubs — they need the full escrow lifecycle
// wired (deploy + fund + registry). submitFiatPayment / confirmFiatPayment are ready
// once signEscrowXdr() is implemented in privy-wallet.ts.
//
// Connection points are marked TODO(ELI) below.

import type { PrivyStellarWallet } from './privy-wallet';
import * as tw from './trustless/client';
import { listEscrows } from './escrow-registry';
import { TRUSTLINES } from './trustless/types';
import type { CreateOrderInput } from '@/types';

const PLATFORM_ADDRESS = process.env.NEXT_PUBLIC_PLATFORM_ADDRESS ?? '';
const PLATFORM_FEE_BPS = 50; // 0.5%

// Pattern #3: idempotency guard — prevents duplicate on-chain writes when a user
// double-taps or the network retries before the first tx is confirmed.
// Key format: `${operation}:${orderId}` — scoped per operation so takeOrder and
// createOrder can run concurrently on different orders.
const inFlight = new Set<string>();

function acquireLock(key: string): boolean {
  if (inFlight.has(key)) return false;
  inFlight.add(key);
  return true;
}

function releaseLock(key: string): void {
  inFlight.delete(key);
}

function findEscrowByOrderId(orderId: string) {
  return listEscrows().find((e) => e.engagementId === orderId);
}

// Called when the taker hits "Confirm Trade".
// TODO(ELI): resolve the contractId for this orderId and call tw.fundEscrow() (crypto-seller taker)
// or tw.deployEscrow() + tw.fundEscrow() (crypto-seller maker accepting a fiat-buyer's take).
// The exact branch depends on the order's `from_crypto` flag.
export async function takeOrder(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  orderId: string;
  fillAmount: number;
}): Promise<void> {
  const key = `takeOrder:${args.orderId}`;
  if (!acquireLock(key)) {
    throw new Error('takeOrder: ya hay una transacción en curso para esta orden.');
  }
  try {
    throw new Error('takeOrder: not yet wired to TW escrow — see TODO(ELI) in trade-actions.ts');
  } finally {
    releaseLock(key);
  }
}

// Called when the fiat buyer taps "I've sent the payment".
// Signals the fiat leg is done — TW moves milestone to in_progress.
export async function submitFiatPayment(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  orderId: string;
}): Promise<void> {
  const key = `submitFiatPayment:${args.orderId}`;
  if (!acquireLock(key)) {
    throw new Error('submitFiatPayment: pago ya enviado, esperando confirmación.');
  }
  try {
    const entry = findEscrowByOrderId(args.orderId);
    if (!entry) throw new Error(`submitFiatPayment: no escrow registry entry for order ${args.orderId}`);
    await tw.changeMilestoneStatus(args.wallet, {
      contractId: entry.contractId,
      milestoneIndex: '0',
      newStatus: 'sent',
      serviceProvider: args.caller,
    });
  } finally {
    releaseLock(key);
  }
}

// Called when the crypto seller confirms fiat was received.
// Approves the milestone then releases USDC to the fiat buyer.
export async function confirmFiatPayment(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  orderId: string;
}): Promise<void> {
  const key = `confirmFiatPayment:${args.orderId}`;
  if (!acquireLock(key)) {
    throw new Error('confirmFiatPayment: confirmación ya en curso.');
  }
  try {
    const entry = findEscrowByOrderId(args.orderId);
    if (!entry) throw new Error(`confirmFiatPayment: no escrow registry entry for order ${args.orderId}`);
    await tw.approveMilestone(args.wallet, {
      contractId: entry.contractId,
      milestoneIndex: '0',
      approver: args.caller,
    });
    await tw.releaseFunds(args.wallet, {
      contractId: entry.contractId,
      releaseSigner: args.caller,
    });
  } finally {
    releaseLock(key);
  }
}

// Called when a maker creates a new order.
// TODO(ELI): derive roles from escrowRolesForTrade(), deploy the TW escrow,
// and (if from_crypto=true) immediately call fundEscrow(). Store contractId via addEscrow().
export async function createOrder(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  input: CreateOrderInput;
}): Promise<void> {
  // Idempotency key: caller + amount + currency + type — same order from same user
  const key = `createOrder:${args.caller}:${args.input.amount}:${args.input.fiatCurrencyCode}:${args.input.type}`;
  if (!acquireLock(key)) {
    throw new Error('createOrder: esta orden ya está siendo publicada.');
  }
  try {
    void tw.deployEscrow; // used once TODO is implemented
    void TRUSTLINES;
    void PLATFORM_ADDRESS;
    void PLATFORM_FEE_BPS;
    throw new Error('createOrder: not yet wired to TW escrow — see TODO(ELI) in trade-actions.ts');
  } finally {
    releaseLock(key);
  }
}
