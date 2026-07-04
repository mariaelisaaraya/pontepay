'use client';

// Real on-chain USDC transfer via Horizon. Replaces the previous fake send
// that only decremented the local store balance.

import type { PrivyStellarWallet } from '@/lib/privy-wallet';

const USDC_TESTNET_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';

interface HorizonErrorShape {
  response?: {
    data?: {
      extras?: { result_codes?: { operations?: string[]; transaction?: string } };
    };
  };
}

function friendlySendError(e: unknown): string {
  const codes = (e as HorizonErrorShape)?.response?.data?.extras?.result_codes;
  const op = codes?.operations?.[0];
  switch (op) {
    case 'op_no_destination':
      return 'Recipient account does not exist on the network (it needs to be funded first)';
    case 'op_no_trust':
      return 'Recipient has not enabled USDC (missing trustline)';
    case 'op_underfunded':
      return 'Insufficient USDC balance for this transfer';
    default:
      break;
  }
  if (codes) return `Transfer rejected: ${JSON.stringify(codes)}`;
  return e instanceof Error ? e.message : 'Transfer failed';
}

/** Sends USDC on Stellar testnet. Returns the confirmed transaction hash. */
export async function sendUsdc(
  wallet: PrivyStellarWallet,
  fromAddress: string,
  toAddress: string,
  amountUsdc: number,
  memoText?: string,
): Promise<string> {
  const { Horizon, Networks, TransactionBuilder, Operation, Asset, Memo, Transaction } =
    await import('@stellar/stellar-sdk');

  const server = new Horizon.Server(HORIZON_TESTNET);
  const usdc = new Asset('USDC', USDC_TESTNET_ISSUER);
  const account = await server.loadAccount(fromAddress);

  const builder = new TransactionBuilder(account, {
    fee: '1000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: toAddress,
        asset: usdc,
        amount: amountUsdc.toFixed(7),
      }),
    )
    .setTimeout(60);

  if (memoText) {
    // Stellar text memos are limited to 28 bytes.
    builder.addMemo(Memo.text(memoText.slice(0, 28)));
  }

  const tx = builder.build();
  const signedXdr = await wallet.signEscrowXdr(tx.toXDR());
  const signedTx = new Transaction(signedXdr, Networks.TESTNET);

  try {
    const result = await server.submitTransaction(signedTx);
    return result.hash;
  } catch (e) {
    console.error('[send-usdc] submit failed:', e);
    throw new Error(friendlySendError(e));
  }
}
