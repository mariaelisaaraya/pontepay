<div align="center">
  <img src="public/images/banner.png" alt="PeerlyPay banner" width="100%" />
  <br />
  <br />
  <img src="public/icon-fuchsia.svg" alt="PeerlyPay logo" width="120" />
  <h1>PeerlyPay 🌍💸</h1>
  <p><strong>Earn Global, Spend Local.</strong></p>
  <p>A mobile-first, <strong>non-custodial</strong> P2P marketplace to trade USDC on Stellar ⇄ Argentine peso (ARS) — built for remote workers, freelancers, and digital nomads who earn in crypto and spend in local fiat.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Zustand-1F1F1F?style=flat-square&logoColor=white" alt="Zustand" />
    <img src="https://img.shields.io/badge/Stellar-111111?style=flat-square&logo=stellar&logoColor=white" alt="Stellar" />
    <img src="https://img.shields.io/badge/Soroban_Rust-0F172A?style=flat-square&logo=rust&logoColor=white" alt="Soroban" />
    <img src="https://img.shields.io/badge/Reflector_Oracle-7C3AED?style=flat-square&logoColor=white" alt="Reflector" />
    <img src="https://img.shields.io/badge/Crossmint-00A3FF?style=flat-square&logoColor=white" alt="Crossmint" />
  </p>
</div>

---

## 🧑‍⚖️ For hackathon judges — start here

**Live app:** `https://<your-vercel-app>.vercel.app` _(set after deploy — see [docs/hackathon/DEPLOY_FRONTEND.md](docs/hackathon/DEPLOY_FRONTEND.md))_

**Two ways to evaluate it:**

1. **Demo mode — no wallet, no setup (30 seconds).** Open the app → **Marketplace**. It is
   pre-populated with clearly-labeled **demo orders**. Click any order and walk the *real*
   screens end-to-end — **Confirm** (showing the live rate with an `oracle` tag) →
   **Payment** (with the interoperable **Transferencias 3.0 QR**) → **Waiting** → **Success** —
   without any on-chain transaction. Demo steps are marked "Demo mode".
2. **Real on-chain path.** Connect a **Crossmint** wallet (email signer, Stellar testnet);
   the trade flow then executes **real Soroban contract writes** and polls the chain.

**Verify the load-bearing Stellar integration directly:**

| What | Where |
|---|---|
| Live ARS rate read **through our contract → Reflector oracle** | `GET /api/rates` → `{"source":"contract", ...}` |
| Deployed p2p escrow contract (testnet) | [`CC2CA5…76TJ`](https://stellar.expert/explorer/testnet/contract/CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ) |
| Live SEP-24 anchor capabilities | `GET /api/anchor/info` · in-app at `/anchor` |
| Contract tests | `cargo test -p p2p` → **20/20** |

**Submission docs:** [PITCH](docs/hackathon/PITCH.md) · [DEMO SCRIPT](docs/hackathon/DEMO_SCRIPT.md) ·
[CUSTOMER DISCOVERY](docs/hackathon/CUSTOMER_DISCOVERY.md) · [SUBMISSION CHECKLIST](docs/hackathon/SUBMISSION_CHECKLIST.md) ·
[CONTEXT (engineering source of truth)](docs/hackathon/CONTEXT.md) · [MAINNET DEPLOY](docs/hackathon/MAINNET_DEPLOY.md) ·
[FRONTEND DEPLOY](docs/hackathon/DEPLOY_FRONTEND.md)

> Honesty note (the rubric rewards it): the **Current limitations** section below lists exactly
> what is real vs. mocked/scaffolded. The escrow, the on-chain oracle rate, the real Crossmint
> writes, and the SEP-24 discovery are **live on testnet**; interactive SEP-24 deposit and the
> Base/Slice cross-chain dispute are **not** built (dispute is single-chain).

---

## What is PeerlyPay?

**PeerlyPay** is a non-custodial peer-to-peer marketplace for swapping **USDC on Stellar** against the **Argentine peso (ARS)** — and back. It is built for the people who feel the dollar/peso gap every day: remote workers, freelancers, and digital nomads in Argentina who **earn in crypto and spend in local fiat**.

> **Earn Global, Spend Local.**

The flow is simple and self-custodial:

1. A **creator** posts an order — either *sell crypto for fiat* or *buy crypto with fiat*.
2. A **taker** fills it (fully or partially).
3. The on-chain USDC is **escrowed in a Soroban smart contract** — never in a company wallet.
4. One side proves an **off-chain fiat payment** (ARS bank/Transferencias 3.0 transfer).
5. The contract **releases the escrowed USDC to the correct party**.
6. If something goes wrong, a single on-chain **`dispute_resolver`** settles it via `resolve_dispute`.

No KYC-heavy CEX. No custodial OTC desk. The peso side stays off-chain (where Argentine fiat lives), the dollar side stays trustless on Stellar, and the contract is the only thing holding funds while a trade is in flight.

---

## Why Stellar (the load-bearing integration)

Stellar is not a logo on a slide here — it is the mechanism that makes the product trustworthy. PeerlyPay's core value props **only exist because of the Soroban contract and the on-chain oracle**.

| Building block | What it does in PeerlyPay | Where |
| --- | --- | --- |
| **Soroban P2P escrow contract** | Holds USDC in escrow per order; enforces the full state machine (create → take → submit fiat → confirm/dispute/timeout → release/refund). This is the trust anchor. | `contracts/contracts/p2p` |
| **On-chain Reflector oracle (SEP-40)** | The contract's `reference_rate` makes a **cross-contract call to the Reflector fiat oracle** and returns the live ARS-per-USD rate. The exchange rate is read from a price feed, **not** set by an admin or hardcoded. | `contracts/contracts/p2p/src/core/oracle.rs` |
| **Crossmint email-signer smart wallets** | Users get a Stellar smart wallet from an email — no seed-phrase friction — and all escrow writes are signed through it. | `src/lib/p2p-crossmint.ts` |
| **SEP-24 anchor discovery** | We read the SDF testnet anchor's live capabilities (SEP-1 TOML + SEP-24 `/info`) to show real on/off-ramp metadata. | `src/app/api/anchor/info/route.ts`, `src/lib/sep24.ts` |
| **Transferencias 3.0 QR** | The payment screen renders an interoperable EMVCo MPM QR (CRC16/CCITT) representing a BCRA Transferencias 3.0 request for the ARS leg that triggers escrow release. | `src/components/trade/Transferencias30QR.tsx` |

### The headline: an on-chain rate, read through our own contract

Most P2P ramps quote a rate from a backend an operator controls. PeerlyPay does not. The exchange rate is read **on-chain**, mediated by *our* contract:

- The deployed contract was configured (via `set_oracle`) to point at the **Reflector SEP-40 fiat exchange-rate oracle**:
  - **Testnet:** `CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W`
  - **Mainnet:** `CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC`
- Calling **`reference_rate(2)`** (where `2` = ARS in `FiatCurrency::from_code`) performs a **cross-contract call** into Reflector, reads the latest ARS price (quoted in USD), inverts it (`10^decimals / price`), and returns the live **ARS-per-USD** rate (currently ~**1461**). This replaced a previous hardcoded `MOCK_RATE = 1485`.
- The frontend reads this rate **through the contract**, not directly from Reflector. `GET /api/rates` returns:

  ```json
  {
    "usdArs": 1461,
    "source": "contract",
    "contract": 1461,
    "reflector": 1461.92,
    "bcraOfficial": 1461,
    "asOf": "..."
  }
  ```

  with a graceful **fallback chain**: our contract `reference_rate` → direct Reflector oracle read → BCRA official API → constant. Verified live this week: `contract = 1461`, `reflector = 1461.92`.

- **BCRA transparency:** `/api/rates` also fetches Argentina's central bank official USD/ARS rate (`https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD`) as an off-chain reference, so the UI can show the gap between the official rate and the market rate.

### Deployed testnet contract

| | |
| --- | --- |
| **Contract ID** | `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ` |
| **Network** | Stellar Testnet (`Test SDF Network ; September 2015`) |
| **RPC** | `https://soroban-testnet.stellar.org` |
| **Oracle** | Reflector SEP-40 fiat oracle (configured via `set_oracle`) |
| **Tests** | `cargo test -p p2p` → **20/20 passing** (including 2 oracle tests) |

**Contract entrypoints:** `initialize`, `pause` / `unpause`, `create_order` / `create_order_cli`, `cancel_order`, `take_order` / `take_order_with_amount`, `submit_fiat_payment`, `execute_fiat_transfer_timeout`, `confirm_fiat_payment`, `dispute_fiat_payment`, `resolve_dispute`, `get_order` / `get_order_count`, `get_config`, and the oracle additions `set_oracle`, `get_oracle`, `reference_rate`.

---

## How it works (user flow)

PeerlyPay supports both directions of trade. Two on-chain roles per order: the **creator** (posts) and the **filler/taker** (fills). One party proves the fiat leg; the contract releases the crypto leg.

**Selling crypto for pesos (`from_crypto = true`)**
1. **Creator** posts a sell order. Their USDC is locked in the escrow contract on `create_order`.
2. **Taker** fills it (`take_order_with_amount`), supports partial fills — leftover reopens the order.
3. **Taker** pays ARS off-chain (bank transfer or by scanning the **Transferencias 3.0 QR**) and calls `submit_fiat_payment`.
4. **Creator** confirms receipt (`confirm_fiat_payment`) → the contract **releases the escrowed USDC to the filler**.

**Buying crypto with pesos (`from_crypto = false`)**
1. **Creator** posts a buy order; the **filler deposits** USDC into escrow when taking it.
2. **Creator** sends ARS off-chain, submits the fiat payment, the filler confirms → USDC **releases to the creator**.

**Safety paths**
- **Timeout:** if the fiat payer never proves payment, `execute_fiat_transfer_timeout` resets the order and refunds the depositor where applicable.
- **Dispute:** either party can `dispute_fiat_payment`; a single on-chain **`dispute_resolver`** settles it with `resolve_dispute(order_id, fiat_transfer_confirmed)` — releasing to the right side or refunding the depositor.

In the app, the real flow lives at `/trade/confirm → /trade/payment → /trade/waiting → /trade/success`, backed by **real Crossmint contract writes** and **5-second on-chain polling**. The marketplace `OrderCard` and order detail page route into this real flow and read real chain data (no fake auto-advancing simulation).

---

## Architecture (feature → code map)

Frontend lives under **`src/`** (Next.js 16 App Router). The live contract lives under **`contracts/contracts/p2p`**.

### Frontend — `src/`

```
src/
├── app/
│   ├── api/
│   │   ├── rates/route.ts          # GET /api/rates — contract reference_rate + Reflector + BCRA
│   │   ├── anchor/info/route.ts    # GET /api/anchor/info — live SEP-1 TOML + SEP-24 /info
│   │   └── match-order/route.ts    # order matching helper
│   ├── marketplace/                # browse open orders (OrderCard → real trade flow)
│   ├── orders/
│   │   ├── [id]/                   # order detail (reads real chain data)
│   │   ├── create/ · post-offer/   # create / post an order
│   │   └── dashboard/              # maker dashboard
│   ├── trade/
│   │   ├── confirm/ · payment/     # confirm terms · render Transferencias 3.0 QR
│   │   ├── waiting/ · success/     # 5s on-chain polling · completion
│   │   └── enable-usdc/            # trustline enablement step
│   ├── anchor/                     # SEP-24 anchor discovery page
│   └── profile/                    # profile + liquidity-provider views
├── components/                     # OrderCard, AnchorCard, BalanceCard, trade/, ui/ (shadcn) ...
├── contexts/                       # React context providers
├── contracts/p2p/                  # generated TS bindings for the p2p contract
├── lib/
│   ├── contract-config.ts          # SINGLE source of truth for the contract id (read + write)
│   ├── p2p.ts                      # read path: get_order, reference_rate, etc.
│   ├── p2p-crossmint.ts            # write path: take/submit/confirm/createOrderWithCrossmint
│   ├── rates-server.ts             # server-side rate snapshot (contract → reflector → bcra → fallback)
│   ├── rates.ts · useLiveRate.ts   # client rate types + hook
│   ├── sep24.ts                    # SEP-1/SEP-24 anchor reading
│   ├── vendor-payment-request.ts   # off-chain fiat payment-request helpers
│   ├── order-mapper.ts · match-order.ts · wallet-balance.ts
│   └── store.ts                    # Zustand store (localStorage-backed UI state)
├── components/trade/Transferencias30QR.tsx  # EMVCo MPM / Transferencias 3.0 QR (CRC16/CCITT)
└── types/                          # shared TypeScript interfaces
```

> **Note on `contract-config.ts`:** read (`p2p.ts`) and write (`p2p-crossmint.ts`) paths previously diverged to *different* contract ids when no env var was set — the app read one contract and wrote to another. `src/lib/contract-config.ts` centralizes the id so both paths resolve to the same contract. This was a real deployment bug, now fixed.

### Contract — `contracts/contracts/p2p`

```
contracts/contracts/p2p/src/
├── lib.rs · contract.rs            # contract surface (all entrypoints)
├── core/
│   ├── order.rs                    # order lifecycle + escrow release/refund logic
│   ├── admin.rs                    # config, pause, set_oracle / get_oracle
│   ├── dispute.rs                  # dispute_fiat_payment, resolve_dispute (single dispute_resolver)
│   ├── oracle.rs                   # Reflector SEP-40 client + reference_rate (cross-contract call)
│   └── validators/                 # admin / order / dispute precondition checks
├── storage/types.rs               # Order, Config, FiatCurrency, PaymentMethod
├── events/handler.rs              # typed events (OrderCreated, OracleSet, DisputeResolved, ...)
├── error.rs                       # ContractError variants
└── tests/test.rs                  # 20 tests (escrow flows, timeouts, disputes, oracle)
```

---

## Run it

### Frontend

```bash
# 1. Configure env
cp .env.example .env
#    NEXT_PUBLIC_CROSSMINT_API_KEY=...        (get one at https://www.crossmint.com/)
#    NEXT_PUBLIC_P2P_CONTRACT_ID=...          (defaults to the deployed testnet contract)
#    NEXT_PUBLIC_SOROBAN_RPC_URL=...          (defaults to soroban-testnet.stellar.org)
#    NEXT_PUBLIC_REFLECTOR_FIAT_ORACLE_ID=... (defaults to the testnet Reflector oracle)

# 2. Install + run
npm install
npm run dev
```

Open `http://localhost:3000`. The app ships pointed at the deployed testnet contract, so `/api/rates` returns a live `source: "contract"` rate out of the box.

### Contracts (build via WSL — important)

> **Build environment note.** The team's Windows machine has **no C linker** (no MSVC/gcc), so `cargo` and the `stellar` CLI **fail natively**. Build, test, and deploy via **WSL Ubuntu** (Rust 1.96 + `cc`/`gcc` + Stellar CLI installed). Run scripts from PowerShell with:
>
> ```powershell
> wsl bash "/mnt/c/Users/usuario/peerly pay/peerlypay/contracts/<script>.sh"
> ```
>
> Use `wsl bash` with `/mnt/...` paths — **Git Bash mangles `/mnt` paths**, so don't run these through Git Bash.

Run the tests (from inside WSL, in `contracts/`):

```bash
cargo test -p p2p     # → 20/20 passing (includes the 2 oracle tests)
```

Helper targets live in `contracts/Makefile`:

```bash
# from contracts/
make p2p-wallet-setup NETWORK=testnet   # create aliases, fund XLM, set USDC trustlines
make p2p-quickstart  NETWORK=testnet    # build → deploy → init → config → seed orders
make p2p-seed-orders NETWORK=testnet    # seed demo orders into a deployed instance
```

After deploying your own instance, set `NEXT_PUBLIC_P2P_CONTRACT_ID` in `.env` to your contract id. For the buy-vs-sell taker flow and how to continue as a market maker from the CLI, see `contracts/README.md` → *P2P Contract*.

---

## Current limitations / mocked features (read this)

We are deliberately explicit about what is real vs. scaffold vs. aspirational. The escrow, the on-chain oracle, the real Crossmint writes, the SEP-24 discovery, and the Transferencias 3.0 QR are **real and live on testnet**. The following are **not** yet complete:

- **Interactive SEP-24 deposit/withdraw is scaffolded, not finished.** Anchor *discovery* (SEP-1 TOML + SEP-24 `/info`) is live, but the SEP-10 wallet-signed challenge and the actual signed deposit/withdraw are the next step — not yet wired end-to-end.
- **No cross-chain dispute resolution.** Any mention of a Base / Slice Protocol cross-chain arbitration bridge is **docs-only / aspirational**. The **real** dispute path is **single-chain**, settled by the contract's single `dispute_resolver` via `resolve_dispute`. There is no relayer and no EVM contract in the live product.
- **Trustline check is a stub.** `checkUSDCTrustline` currently returns `true` unconditionally; a real trustline lookup is pending.
- **No backend.** Bank details, maker names, and any reputation/trust scores shown in some screens are **placeholder**. App state lives in `localStorage` / Zustand only — there is no server-side datastore.
- **The deployed testnet instance uses a throwaway admin key and has no seeded orders.** For a real demo, the team should **redeploy from their own funded admin identity**, seed orders (`make p2p-seed-orders`), and set `NEXT_PUBLIC_P2P_CONTRACT_ID` to the new instance.
- **An older Trustless Work escrow crate exists in the repo (`contracts/contracts/escrow`) but is not wired to the app.** The **`p2p` contract is the live one**; the escrow crate is legacy scaffold.

---

## Why this matters (market)

Argentina is a structural stablecoin market, not a hype cycle:

- **Stablecoins made up over half of all ARS exchange purchases** between Jul 2024 and Jun 2025 (*Chainalysis 2025 LATAM report*).
- **Argentina ranks #2 in LATAM by crypto volume**, driven by persistent inflation, currency volatility, and capital controls — **structural** demand, not hypergrowth (Milei-era disinflation has slowed *growth rates*, but the underlying need persists).
- Most incumbents (**Lemon, Belo, Buenbit, Ripio**) are **custodial**. PeerlyPay is **non-custodial P2P**.
- **Precedent:** Anclap is a live Stellar anchor issuing an ARS token — proof that ARS-on-Stellar is real. PeerlyPay differs by being **non-custodial P2P** and by bridging **Transferencias 3.0** to Stellar (no known existing project links T3.0 to Stellar).

**Differentiators:** (a) non-custodial P2P escrow on Soroban; (b) an on-chain Reflector oracle rate read through our own contract (not a hardcoded/admin rate); (c) Argentina-native Transferencias 3.0 linkage; (d) BCRA official-rate transparency.

---

## Built for PULSO Argentina

PeerlyPay is a submission to the **PULSO Argentina** hackathon (NearX + Stellar Development Foundation) — a 10-day online build across Brazil, Argentina, and Colombia.

| Judging criterion | How PeerlyPay addresses it |
| --- | --- |
| **Integration depth & technical complexity** | Soroban escrow state machine + a **cross-contract call** into the Reflector SEP-40 oracle for live on-chain pricing; Crossmint smart-wallet writes; SEP-24 anchor reads. |
| **Impact on the Stellar ecosystem** | A non-custodial fiat ⇄ USDC ramp with a novel **Transferencias 3.0 → Stellar** linkage, built on core Stellar building blocks. |
| **Customer discovery & validation** | See `CUSTOMER_DISCOVERY` and the pitch materials. |
| **Quality of testnet/mainnet deployment** | Live testnet contract `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ`, 20/20 tests, verified live rate reads. |

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand · Crossmint email-signer Stellar smart wallets (testnet) · Soroban Rust contract (`soroban-sdk 23.1.1`).

---

## Team

- **Alexis**
- **Steven**
- **Stefano**
- **Barb**

---

## License

MIT

---

<div align="center">
  <em>Earn Global, Spend Local. Built on Stellar.</em>
</div>
