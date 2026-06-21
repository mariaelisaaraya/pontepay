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

function findEscrowByOrderId(orderId: string) {
  return listEscrows().find((e) => e.engagementId === orderId);
}

// Called when the taker hits "Confirm Trade".
// TODO(ELI): resolve the contractId for this orderId and call tw.fundEscrow() (crypto-seller taker)
// or tw.deployEscrow() + tw.fundEscrow() (crypto-seller maker accepting a fiat-buyer's take).
// The exact branch depends on the order's `from_crypto` flag.
export async function takeOrder(_args: {
  wallet: PrivyStellarWallet;
  caller: string;
  orderId: string;
  fillAmount: number;
}): Promise<void> {
  throw new Error('takeOrder: not yet wired to TW escrow — see TODO(ELI) in trade-actions.ts');
}

// Called when the fiat buyer taps "I've sent the payment".
// Signals the fiat leg is done — TW moves milestone to in_progress.
export async function submitFiatPayment(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  orderId: string;
}): Promise<void> {
  const entry = findEscrowByOrderId(args.orderId);
  if (!entry) throw new Error(`submitFiatPayment: no escrow registry entry for order ${args.orderId}`);
  await tw.changeMilestoneStatus(args.wallet, {
    contractId: entry.contractId,
    milestoneIndex: '0',
    newStatus: 'sent',
    serviceProvider: args.caller,
  });
}

// Called when the crypto seller confirms fiat was received.
// Approves the milestone then releases USDC to the fiat buyer.
export async function confirmFiatPayment(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  orderId: string;
}): Promise<void> {
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
}

// Called when a maker creates a new order.
// TODO(ELI): derive roles from escrowRolesForTrade(), deploy the TW escrow,
// and (if from_crypto=true) immediately call fundEscrow(). Store contractId via addEscrow().
export async function createOrder(_args: {
  wallet: PrivyStellarWallet;
  caller: string;
  input: CreateOrderInput;
}): Promise<void> {
  void tw.deployEscrow; // used once TODO is implemented
  void TRUSTLINES;
  void PLATFORM_ADDRESS;
  void PLATFORM_FEE_BPS;
  throw new Error('createOrder: not yet wired to TW escrow — see TODO(ELI) in trade-actions.ts');
}
