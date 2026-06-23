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

// Called when the taker hits "Confirm Trade".
export async function takeOrder(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  orderId: string;
  fillAmount: number;
}): Promise<void> {
  const p2p = makeWriteClient(args.caller);
  const tx = await p2p.take_order_with_amount({
    caller: args.caller,
    order_id: BigInt(args.orderId),
    fill_amount: BigInt(args.fillAmount),
  });
  await sorobanSubmit(tx, (xdr) => args.wallet.signEscrowXdr(xdr));
}

// Called when the fiat buyer taps "I've sent the payment".
export async function submitFiatPayment(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  orderId: string;
}): Promise<void> {
  const p2p = makeWriteClient(args.caller);
  const tx = await p2p.submit_fiat_payment({
    caller: args.caller,
    order_id: BigInt(args.orderId),
  });
  await sorobanSubmit(tx, (xdr) => args.wallet.signEscrowXdr(xdr));
}

// Called when the crypto seller confirms fiat was received → releases USDC.
export async function confirmFiatPayment(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  orderId: string;
}): Promise<void> {
  const p2p = makeWriteClient(args.caller);
  const tx = await p2p.confirm_fiat_payment({
    caller: args.caller,
    order_id: BigInt(args.orderId),
  });
  await sorobanSubmit(tx, (xdr) => args.wallet.signEscrowXdr(xdr));
}

// Called when a maker creates a new sell order (type='sell' → from_crypto=true, locks USDC).
export async function createOrder(args: {
  wallet: PrivyStellarWallet;
  caller: string;
  input: CreateOrderInput;
}): Promise<void> {
  const p2p = makeWriteClient(args.caller);
  const tx = await p2p.create_order_cli({
    caller: args.caller,
    fiat_currency_code: args.input.fiatCurrencyCode ?? 2, // 2 = ARS
    payment_method_code: args.input.paymentMethodCode ?? 0, // 0 = BankTransfer
    from_crypto: args.input.type === 'sell',
    amount: BigInt(args.input.amount),
    exchange_rate: BigInt(args.input.rate),
    duration_secs: BigInt(args.input.durationSecs ?? 604800),
  });
  await sorobanSubmit(tx, (xdr) => args.wallet.signEscrowXdr(xdr));
}
