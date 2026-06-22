// Pattern #4: 4-phase Soroban submit — simulate → auth tree → footprint → submit with retries.
//
// Background:
//   The generated Contract Client already calls simulate() before signAndSend().
//   But it doesn't handle two failure modes we see in Testnet:
//     a) Expired ledger entries → restore the footprint, then re-simulate
//     b) Transient network errors / "txFAILED" resubmit race → retry with backoff
//
// Usage (Eli wires this into takeOrder / createOrder):
//
//   import { sorobanSubmit } from '@/lib/soroban-submit';
//
//   const tx = await client.take_order_with_amount({ caller, order_id, fill_amount });
//   const hash = await sorobanSubmit(tx, (xdr) => wallet.signEscrowXdr(xdr));
//
// The sign callback receives the unsigned XDR string and must return the signed XDR.
// For Privy wallets this maps to wallet.signEscrowXdr().

import {
  rpc,
  TransactionBuilder,
  Networks,
  type Transaction,
} from '@stellar/stellar-sdk';

// ─── Config ───────────────────────────────────────────────────────────────────

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL?.trim() ||
  'https://soroban-testnet.stellar.org';

const PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE?.trim() ||
  Networks.TESTNET;

const MAX_SUBMIT_RETRIES = 3;
const BACKOFF_BASE_MS = 300;

// ─── Types ────────────────────────────────────────────────────────────────────

interface HasXDR {
  toXDR(): string;
}

export type SignCallback = (unsignedXdr: string) => Promise<string>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getServer(): rpc.Server {
  return new rpc.Server(RPC_URL, { allowHttp: true });
}

function isExpiredEntryError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('ExpiredEntry') ||
    msg.includes('expired') ||
    msg.includes('TtlExpired')
  );
}

// ─── Footprint restore ────────────────────────────────────────────────────────

async function restoreExpiredEntries(
  server: rpc.Server,
  txXdr: string,
  sign: SignCallback,
): Promise<void> {
  const tx = TransactionBuilder.fromXDR(txXdr, PASSPHRASE) as Transaction;
  const simResult = await server.simulateTransaction(tx);

  if (!rpc.Api.isSimulationSuccess(simResult)) {
    throw new Error('[soroban-submit] Could not simulate for footprint restore');
  }

  const restoreTx = rpc.assembleTransaction(tx, simResult).build();
  const signedRestoreXdr = await sign(restoreTx.toXDR());
  const signedRestoreTx = TransactionBuilder.fromXDR(signedRestoreXdr, PASSPHRASE) as Transaction;

  const restoreResult = await server.sendTransaction(signedRestoreTx);
  if (restoreResult.status === 'ERROR') {
    throw new Error(`[soroban-submit] Footprint restore failed: ${JSON.stringify(restoreResult)}`);
  }

  // Wait for restore tx to land (up to 20s)
  let restoreStatus: rpc.Api.GetTransactionResponse | null = null;
  for (let i = 0; i < 10; i++) {
    await sleep(2000);
    restoreStatus = await server.getTransaction(restoreResult.hash);
    if (restoreStatus.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) break;
  }
  if (restoreStatus?.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error('[soroban-submit] Footprint restore tx did not land in time');
  }
}

// ─── Main submit function ─────────────────────────────────────────────────────

/**
 * 4-phase Soroban submit:
 *   1. Simulate (detect expired entries)
 *   2. Restore footprint if expired entries detected, then re-simulate
 *   3. Assemble auth tree + sign
 *   4. Submit with exponential back-off retries
 *
 * @returns The confirmed transaction hash
 */
export async function sorobanSubmit(
  assembledTx: HasXDR,
  sign: SignCallback,
): Promise<string> {
  const server = getServer();
  const unsignedXdr = assembledTx.toXDR();
  const tx = TransactionBuilder.fromXDR(unsignedXdr, PASSPHRASE) as Transaction;

  // ── Phase 1: Simulate ──────────────────────────────────────────────────────
  let simResult = await server.simulateTransaction(tx);

  // ── Phase 2: Restore footprint if entries expired, re-simulate ────────────
  if (rpc.Api.isSimulationError(simResult) && isExpiredEntryError(simResult.error)) {
    console.info('[soroban-submit] expired entry detected — restoring footprint');
    await restoreExpiredEntries(server, unsignedXdr, sign);
    simResult = await server.simulateTransaction(tx);
  }

  if (!rpc.Api.isSimulationSuccess(simResult)) {
    const errMsg = rpc.Api.isSimulationError(simResult) ? simResult.error : 'Simulation failed';
    throw new Error(`[soroban-submit] Simulation failed: ${errMsg}`);
  }

  // ── Phase 3: Assemble auth tree + sign ────────────────────────────────────
  const readyTx = rpc.assembleTransaction(tx, simResult).build();
  const signedXdr = await sign(readyTx.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, PASSPHRASE) as Transaction;

  // ── Phase 4: Submit with exponential back-off ──────────────────────────────
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_SUBMIT_RETRIES; attempt++) {
    if (attempt > 0) {
      const backoff = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
      console.info(`[soroban-submit] retry ${attempt}/${MAX_SUBMIT_RETRIES - 1} in ${backoff}ms`);
      await sleep(backoff);
    }

    try {
      const sendResult = await server.sendTransaction(signedTx);

      if (sendResult.status === 'ERROR') {
        lastError = new Error(`[soroban-submit] sendTransaction error: ${JSON.stringify(sendResult)}`);
        continue;
      }

      const txHash = sendResult.hash;

      for (let poll = 0; poll < 15; poll++) {
        await sleep(2000);
        const status = await server.getTransaction(txHash);

        if (status.status === rpc.Api.GetTransactionStatus.SUCCESS) {
          console.info(`[soroban-submit] confirmed: ${txHash}`);
          return txHash;
        }

        if (status.status === rpc.Api.GetTransactionStatus.FAILED) {
          throw new Error(`[soroban-submit] tx failed: ${txHash}`);
        }
        // NOT_FOUND → still propagating, keep polling
      }

      lastError = new Error(`[soroban-submit] tx not confirmed after 30s: ${txHash}`);
    } catch (err) {
      if (err instanceof Error && err.message.includes('tx failed')) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('[soroban-submit] max retries exceeded');
}
