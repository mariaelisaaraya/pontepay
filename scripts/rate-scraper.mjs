#!/usr/bin/env node
/**
 * PontePay rate scraper — polls BCRA + Reflector every 15 min,
 * saves CSV history, and logs meaningful rate changes.
 *
 * Usage:
 *   node scripts/rate-scraper.mjs              # run once
 *   node scripts/rate-scraper.mjs --watch      # poll every 15 min
 *
 * Output: data/rate-history.csv
 */

import { writeFileSync, appendFileSync, existsSync, readFileSync } from 'fs';
import { mkdirSync } from 'fs';

// ── Config ────────────────────────────────────────────────────────────────────
const SPREAD_BPS = 80;           // 0.80%
const ROUND_STEP = 5;            // snap to nearest 5 ARS
const INTERVAL_MS = 15 * 60 * 1000; // 15 min
const CSV_PATH = 'data/rate-history.csv';
const CSV_HEADER = 'timestamp,source,midRate,buyRate,sellRate,spreadArs,spreadPct\n';

const BCRA_URL =
  'https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD';

// Optional: hit local Next.js server if running
const LOCAL_API = process.env.PONTEPAY_API_URL || 'http://localhost:3000/api/rates';

// ── Spread helpers (mirrors src/lib/pricing.ts) ───────────────────────────────
const roundUp   = (v, s = ROUND_STEP) => Math.ceil(v / s) * s;
const roundDown = (v, s = ROUND_STEP) => Math.floor(v / s) * s;
const buyRate   = (mid) => roundUp(mid * (1 + SPREAD_BPS / 10_000));
const sellRate  = (mid) => roundDown(mid * (1 - SPREAD_BPS / 10_000));

// ── Rate sources ──────────────────────────────────────────────────────────────
async function fetchFromLocalApi() {
  try {
    const res = await fetch(LOCAL_API, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return null;
    const j = await res.json();
    if (!j?.usdArs) return null;
    return { mid: j.usdArs, source: `local-api(${j.source})` };
  } catch {
    return null;
  }
}

async function fetchFromBcra() {
  try {
    const res = await fetch(BCRA_URL, {
      headers: { 'User-Agent': 'PontePay-Scraper/1.0' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const entry = json.results?.[0];
    const usd = entry?.detalle?.find((d) => d.codigoMoneda === 'USD');
    const rate = usd?.tipoCotizacion;
    if (!rate || !Number.isFinite(rate)) return null;
    return { mid: rate, source: 'bcra-official' };
  } catch {
    return null;
  }
}

// ── Main tick ─────────────────────────────────────────────────────────────────
async function tick() {
  const ts = new Date().toISOString();

  // Prefer local Next.js API (has Reflector + contract rate), fall back to BCRA
  const result = (await fetchFromLocalApi()) ?? (await fetchFromBcra());

  if (!result) {
    console.warn(`[${ts}] ⚠️  All sources failed — skipping tick`);
    return null;
  }

  const { mid, source } = result;
  const buy  = buyRate(mid);
  const sell = sellRate(mid);
  const spreadArs = buy - sell;
  const spreadPct = ((spreadArs / mid) * 100).toFixed(4);

  const row = `${ts},${source},${mid.toFixed(2)},${buy},${sell},${spreadArs},${spreadPct}`;

  // Init CSV if new
  if (!existsSync(CSV_PATH)) {
    mkdirSync('data', { recursive: true });
    writeFileSync(CSV_PATH, CSV_HEADER);
    console.log(`[${ts}] Created ${CSV_PATH}`);
  }

  appendFileSync(CSV_PATH, row + '\n');

  console.log(
    `[${ts}] ${source} | mid=${mid.toFixed(2)} | buy=${buy} | sell=${sell} | spread=${spreadArs} ARS (${spreadPct}%)`
  );

  return { mid, buy, sell };
}

// ── Entry point ───────────────────────────────────────────────────────────────
const watch = process.argv.includes('--watch');

if (watch) {
  console.log(`PontePay rate scraper — polling every 15 min → ${CSV_PATH}`);
  tick(); // immediate first tick
  setInterval(tick, INTERVAL_MS);
} else {
  tick().then((r) => {
    if (!r) process.exit(1);
  });
}
