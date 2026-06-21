import { StellarWallet } from '@crossmint/client-sdk-react-ui';
import { createOrderInputToContractArgs } from '@/lib/order-mapper';
import { resolveP2PContractId } from '@/lib/contract-config';
import type { CreateOrderInput } from '@/types';

type CrossmintWalletLike = unknown;

function normalizeOrderId(orderId: string | number | bigint): string {
  if (typeof orderId === 'bigint') {
    return orderId.toString();
  }

  return String(orderId).trim();
}

const TOKEN_SCALE = 10_000_000;

function usdcToContractAmount(value: number): string {
  return BigInt(Math.round(value * TOKEN_SCALE)).toString();
}

export async function takeOrderWithCrossmint(params: {
  wallet: CrossmintWalletLike | null | undefined;
  caller: string;
  orderId: string | number | bigint;
  fillAmount: number;
}) {
  const { wallet, caller, orderId, fillAmount } = params;

  if (!wallet) {
    throw new Error('Wallet is not connected');
  }

  const stellarWallet = StellarWallet.from(wallet as never);
  return stellarWallet.sendTransaction({
    contractId: resolveP2PContractId(),
    method: 'take_order_with_amount',
    args: {
      caller,
      order_id: normalizeOrderId(orderId),
      fill_amount: usdcToContractAmount(fillAmount),
    },
  });
}

export async function submitFiatPaymentWithCrossmint(params: {
  wallet: CrossmintWalletLike | null | undefined;
  caller: string;
  orderId: string | number | bigint;
}) {
  const { wallet, caller, orderId } = params;

  if (!wallet) {
    throw new Error('Wallet is not connected');
  }

  const stellarWallet = StellarWallet.from(wallet as never);
  return stellarWallet.sendTransaction({
    contractId: resolveP2PContractId(),
    method: 'submit_fiat_payment',
    args: {
      caller,
      order_id: normalizeOrderId(orderId),
    },
  });
}

export async function confirmFiatPaymentWithCrossmint(params: {
  wallet: CrossmintWalletLike | null | undefined;
  caller: string;
  orderId: string | number | bigint;
}) {
  const { wallet, caller, orderId } = params;

  if (!wallet) {
    throw new Error('Wallet is not connected');
  }

  const stellarWallet = StellarWallet.from(wallet as never);
  return stellarWallet.sendTransaction({
    contractId: resolveP2PContractId(),
    method: 'confirm_fiat_payment',
    args: {
      caller,
      order_id: normalizeOrderId(orderId),
    },
  });
}

export async function createOrderWithCrossmint(params: {
  wallet: CrossmintWalletLike | null | undefined;
  caller: string;
  input: CreateOrderInput;
}) {
  const { wallet, caller, input } = params;

  if (!wallet) {
    throw new Error('Wallet is not connected');
  }

  const contractArgs = createOrderInputToContractArgs(input);
  const stellarWallet = StellarWallet.from(wallet as never);

  return stellarWallet.sendTransaction({
    contractId: resolveP2PContractId(),
    method: 'create_order_cli',
    args: {
      caller,
      fiat_currency_code: contractArgs.fiat_currency_code,
      payment_method_code: contractArgs.payment_method_code,
      from_crypto: contractArgs.from_crypto,
      amount: contractArgs.amount.toString(),
      exchange_rate: contractArgs.exchange_rate.toString(),
      duration_secs: String(contractArgs.duration_secs),
    },
  });
}
