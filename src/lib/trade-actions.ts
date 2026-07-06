// P2P trade actions — bridges the UI trade flow to the on-chain P2P contract.
'use client';

import { Client, networks } from '@/contracts/p2p/src';
import { resolveP2PContractId } from '@/lib/contract-config';
import { sorobanSubmit } from '@/lib/soroban-submit';
import type { PrivyStellarWallet } from './privy-wallet';
import type { CreateOrderInput } from '@/types';

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL?.trim() ||
  'https://soroban-testnet.stellar.org';

const PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE?.trim() ||
  networks.testnet.networkPassphrase;

function makeWriteClient(callerAddress: string) {
  return new Client({
    contractId: resolveP2PContractId(),
    rpcUrl: RPC_URL,
    networkPassphrase: PASSPHRASE,
    publicKey: callerAddress,
  });
}

// Pattern #3: idempotency guard — prevents duplicate on-chain writes when a user
// double-taps or the network retries before the first tx is confirmed.
const inFlight = new Set<string>();

function acquireLock(key: string): boolean {
  if (inFlight.has(key)) return false;
  inFlight.add(key);
  return true;
}

function releaseLock(key: string): void {
  inFlight.delete(key);
}

// Called when the taker hits "Confirm Trade". Returns the confirmed tx hash.
export async function takeOrder(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  orderId: string;
  fillAmount: number;
}): Promise<string> {
  const key = `takeOrder:${args.orderId}`;
  if (!acquireLock(key)) {
    throw new Error('takeOrder: ya hay una transacción en curso para esta orden.');
  }
  try {
    const p2p = makeWriteClient(args.caller);
    const tx = await p2p.take_order_with_amount({
      caller: args.caller,
      order_id: BigInt(args.orderId),
      fill_amount: BigInt(Math.round(args.fillAmount * 10_000_000)),
    });
    return await sorobanSubmit(tx, (xdr) => args.wallet.signEscrowXdr(xdr));
  } finally {
    releaseLock(key);
  }
}

// Called when the fiat buyer taps "I've sent the payment". Returns the tx hash.
export async function submitFiatPayment(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  orderId: string;
}): Promise<string> {
  const key = `submitFiatPayment:${args.orderId}`;
  if (!acquireLock(key)) {
    throw new Error('submitFiatPayment: pago ya enviado, esperando confirmación.');
  }
  try {
    const p2p = makeWriteClient(args.caller);
    const tx = await p2p.submit_fiat_payment({
      caller: args.caller,
      order_id: BigInt(args.orderId),
    });
    return await sorobanSubmit(tx, (xdr) => args.wallet.signEscrowXdr(xdr));
  } finally {
    releaseLock(key);
  }
}

// Called when the crypto seller confirms fiat was received → releases USDC.
// Returns the confirmed tx hash.
export async function confirmFiatPayment(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  orderId: string;
}): Promise<string> {
  const key = `confirmFiatPayment:${args.orderId}`;
  if (!acquireLock(key)) {
    throw new Error('confirmFiatPayment: confirmación ya en curso.');
  }
  try {
    const p2p = makeWriteClient(args.caller);
    const tx = await p2p.confirm_fiat_payment({
      caller: args.caller,
      order_id: BigInt(args.orderId),
    });
    return await sorobanSubmit(tx, (xdr) => args.wallet.signEscrowXdr(xdr));
  } finally {
    releaseLock(key);
  }
}

// Called when a maker creates a new sell order (type='sell' → from_crypto=true, locks USDC).
export async function createOrder(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  input: CreateOrderInput;
}): Promise<void> {
  const key = `createOrder:${args.caller}:${args.input.amount}:${args.input.fiatCurrencyCode}:${args.input.type}`;
  if (!acquireLock(key)) {
    throw new Error('createOrder: esta orden ya está siendo publicada.');
  }
  try {
    const p2p = makeWriteClient(args.caller);
    const tx = await p2p.create_order_cli({
      caller: args.caller,
      fiat_currency_code: args.input.fiatCurrencyCode ?? 2, // 2 = ARS
      payment_method_code: args.input.paymentMethodCode ?? 0, // 0 = BankTransfer
      from_crypto: args.input.type === 'sell',
      amount: BigInt(Math.round(args.input.amount * 10_000_000)),
      exchange_rate: BigInt(Math.round(args.input.rate)),
      duration_secs: BigInt(args.input.durationSecs ?? 604800),
    });
    await sorobanSubmit(tx, (xdr) => args.wallet.signEscrowXdr(xdr));
  } finally {
    releaseLock(key);
  }
}
