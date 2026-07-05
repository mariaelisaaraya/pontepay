// Server-only rate sources. Imported by the /api/rates route handler.
//   - Reflector: live ARS price read on-chain from the SEP-40 fiat oracle.
//   - BCRA: official wholesale USD/ARS rate (off-chain), fetched server-side to
//     avoid browser CORS against the BCRA API.

import {
  rpc,
  Contract,
  TransactionBuilder,
  Networks,
  Account,
  scValToNative,
  nativeToScVal,
  xdr,
} from '@stellar/stellar-sdk';

import { FALLBACK_USD_ARS, type RateSnapshot, type RateSource } from '@/lib/rates/rates';
import { loadReferenceRateFromContract } from '@/lib/trade/p2p';
import { applyBuySpread, applySellSpread } from '@/lib/rates/pricing';

// FiatCurrency::from_code in the p2p contract: 2 = ARS.
const ARS_CURRENCY_CODE = 2;

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL?.trim() || 'https://soroban-testnet.stellar.org';

// Reflector fiat exchange-rate oracle (SEP-40). Testnet default; quoted vs USD.
const REFLECTOR_FIAT_ORACLE_ID =
  process.env.NEXT_PUBLIC_REFLECTOR_FIAT_ORACLE_ID?.trim() ||
  'CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W';

// Canonical "null" account; used only to build read-only simulations (no signing).
const SIM_SOURCE = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

const BCRA_USD_URL =
  'https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD';

async function simulateView(
  server: rpc.Server,
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
): Promise<unknown> {
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(new Account(SIM_SOURCE, '0'), {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Reflector simulation failed: ${sim.error}`);
  }
  return scValToNative(sim.result!.retval);
}

/**
 * Live ARS price read from the Reflector fiat oracle and inverted to "ARS per 1
 * USD". The oracle quotes each asset in USD (base = USD), scaled by `decimals`.
 */
export async function fetchReflectorUsdArs(): Promise<number | null> {
  try {
    const server = new rpc.Server(RPC_URL);
    const arsAsset = xdr.ScVal.scvVec([
      nativeToScVal('Other', { type: 'symbol' }),
      nativeToScVal('ARS', { type: 'symbol' }),
    ]);

    const [price, decimals] = await Promise.all([
      simulateView(server, REFLECTOR_FIAT_ORACLE_ID, 'lastprice', [arsAsset]) as Promise<
        { price: bigint; timestamp: bigint } | null
      >,
      simulateView(server, REFLECTOR_FIAT_ORACLE_ID, 'decimals') as Promise<number | bigint>,
    ]);

    if (!price || typeof price.price !== 'bigint' || price.price <= BigInt(0)) return null;

    const scale = 10 ** Number(decimals); // 1e14 for the fiat oracle
    const usdArs = scale / Number(price.price);
    return Number.isFinite(usdArs) && usdArs > 0 ? usdArs : null;
  } catch (error) {
    console.warn('[rates] reflector read failed', error);
    return null;
  }
}

/**
 * Live ARS/USD rate read THROUGH the p2p contract's `reference_rate`, which does
 * an on-chain cross-contract call to the Reflector oracle. This is the most
 * "load-bearing" path: the rate is mediated by our own Soroban contract.
 */
export async function fetchContractReferenceRate(): Promise<number | null> {
  try {
    const rate = await loadReferenceRateFromContract(ARS_CURRENCY_CODE);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch (error) {
    console.warn('[rates] contract reference_rate read failed', error);
    return null;
  }
}

/** Official BCRA wholesale USD/ARS rate (ARS per 1 USD). */
export async function fetchBcraOfficialUsdArs(): Promise<{ rate: number; asOf: string } | null> {
  try {
    const res = await fetch(BCRA_USD_URL, {
      headers: { 'User-Agent': 'PontePay/1.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`BCRA HTTP ${res.status}`);

    const json = (await res.json()) as {
      results?: Array<{
        fecha?: string;
        detalle?: Array<{ codigoMoneda?: string; tipoCotizacion?: number }>;
      }>;
    };

    const entry = json.results?.[0];
    const usd = entry?.detalle?.find((d) => d.codigoMoneda === 'USD');
    const rate = usd?.tipoCotizacion;
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;

    return { rate, asOf: entry?.fecha ?? '' };
  } catch (error) {
    console.warn('[rates] bcra read failed', error);
    return null;
  }
}

/**
 * Combined snapshot. Preference order:
 *   1. p2p contract `reference_rate` (on-chain, mediated by our contract)
 *   2. direct Reflector oracle read
 *   3. BCRA official rate
 *   4. constant fallback
 */
export async function getRateSnapshot(): Promise<RateSnapshot> {
  const [contract, reflector, bcra] = await Promise.all([
    fetchContractReferenceRate(),
    fetchReflectorUsdArs(),
    fetchBcraOfficialUsdArs(),
  ]);

  const bcraOfficial = bcra?.rate ?? null;
  const usdArs = contract ?? reflector ?? bcraOfficial ?? FALLBACK_USD_ARS;
  const source: RateSource =
    contract != null
      ? 'contract'
      : reflector != null
        ? 'reflector'
        : bcraOfficial != null
          ? 'bcra'
          : 'fallback';

  return {
    usdArs,
    source,
    contract,
    reflector,
    bcraOfficial,
    asOf: bcra?.asOf || '',
    buyRate: applyBuySpread(usdArs),
    sellRate: applySellSpread(usdArs),
  };
}
