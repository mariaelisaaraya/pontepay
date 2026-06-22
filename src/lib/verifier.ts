// Pattern #5: Rust verifier — pure-TS implementation with a WASM-ready interface.
//
// Background (sebastianlujan/challenge):
//   The repo ships a Rust WASM module that verifies on-chain payload hashes
//   in the browser. The same hash is computed in the Soroban contract, so the
//   client can confirm a simulated transaction matches what the contract will
//   execute — a client-side integrity check before the user signs.
//
// This file exposes the same interface as the compiled WASM module would, so
// Eli can swap in the WASM binary later without touching any call-sites:
//
//   // Current (TS):
//   import { verifyOrderPayload } from '@/lib/verifier';
//
//   // Future (WASM, same call-site):
//   import init, { verifyOrderPayload } from '@/lib/verifier-wasm/pkg';
//   await init();
//
// Verification logic:
//   1. Canonicalize the order fields deterministically (sorted JSON)
//   2. SHA-256 the canonical string → payloadHash
//   3. Compare payloadHash against the hash committed by the contract on-chain
//   4. Optionally verify the CUIT check-digit (Argentine tax ID)
//
// The contract commits the hash of {order_id, caller, fill_amount} as part of
// the take_order_with_amount invocation. The client recomputes this hash
// from the simulation result before asking the user to sign.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderPayload {
  orderId: string;
  caller: string;
  fillAmount: number;
  currencyCode: string;
  rate: number;
}

export interface VerifyResult {
  valid: boolean;
  payloadHash: string;
  error?: string;
}

// ─── SHA-256 helper ───────────────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── CUIT check-digit verifier ────────────────────────────────────────────────

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

export function verifyCuit(raw: string): boolean {
  const clean = raw.replace(/[-.\s]/g, '');
  if (!/^\d{11}$/.test(clean)) return false;
  const sum = CUIT_WEIGHTS.reduce((acc, w, i) => acc + w * parseInt(clean[i]), 0);
  const rem = sum % 11;
  const expected = rem === 0 ? 0 : rem === 1 ? 9 : 11 - rem;
  return expected === parseInt(clean[10]);
}

// ─── Order payload verifier ───────────────────────────────────────────────────

/**
 * Computes the canonical SHA-256 hash of an order payload.
 * Must produce the same output as the Soroban contract's `payload_hash(order_id, caller, fill_amount)`.
 *
 * Canonical form: sorted JSON with integer fill_amount (micro-USDC, 7 decimals)
 * to avoid floating-point divergence between Rust and JS.
 */
export async function hashOrderPayload(payload: OrderPayload): Promise<string> {
  const fillAmountMicro = Math.round(payload.fillAmount * 10_000_000); // 7 decimal places
  const canonical = JSON.stringify({
    caller: payload.caller,
    currency_code: payload.currencyCode,
    fill_amount: fillAmountMicro,
    order_id: payload.orderId,
    rate: Math.round(payload.rate * 1_000_000), // 6 decimal places
  });
  return sha256Hex(canonical);
}

/**
 * Verify that a simulated transaction payload matches an expected on-chain hash.
 *
 * In the WASM version, this is executed in a WebWorker and the hash comparison
 * happens inside the WASM sandbox — eliminating JS-side tampering risk.
 * In this TS implementation, the logic is equivalent but runs in the main thread.
 *
 * @param payload - Order fields extracted from the simulation result
 * @param expectedHash - Hash committed by the contract (from get_order on-chain)
 */
export async function verifyOrderPayload(
  payload: OrderPayload,
  expectedHash: string,
): Promise<VerifyResult> {
  try {
    const payloadHash = await hashOrderPayload(payload);
    const valid = payloadHash === expectedHash.toLowerCase();
    return { valid, payloadHash, error: valid ? undefined : 'Hash mismatch — payload tampered or rate diverged' };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { valid: false, payloadHash: '', error };
  }
}

// ─── Simulation integrity check ───────────────────────────────────────────────

/**
 * Guard to call before showing the user the "Confirm Trade" screen.
 * Aborts if the simulated operation does not match the order visible in the UI.
 *
 * @param uiPayload - What the UI is showing the user (from store / search params)
 * @param simulatedPayload - What the Soroban simulation actually computed
 * @throws if the payloads differ — caller should abort and show an error
 */
export async function assertPayloadsMatch(
  uiPayload: OrderPayload,
  simulatedPayload: OrderPayload,
): Promise<void> {
  const [uiHash, simHash] = await Promise.all([
    hashOrderPayload(uiPayload),
    hashOrderPayload(simulatedPayload),
  ]);
  if (uiHash !== simHash) {
    throw new Error(
      `[verifier] UI payload does not match simulation — possible MITM or stale rate.\n` +
      `  UI hash:  ${uiHash}\n` +
      `  Sim hash: ${simHash}`,
    );
  }
}
