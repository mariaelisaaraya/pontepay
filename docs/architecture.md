# PeerlyPay — Architecture

**A non-custodial P2P marketplace where Argentine freelancers swap USDC for pesos — backed by a Soroban escrow, a live on-chain oracle, and a yield vault that puts idle dollars to work.**

This document describes the PeerlyPay application architecture: what it does, which Stellar tools it uses, how the contracts and the off-chain layer fit together, and the flows that connect them. Diagrams use [Mermaid](https://mermaid.js.org/) and render on GitHub.

---

## 1. High-level system overview

```mermaid
flowchart TB
  subgraph Users["Users"]
    Freelancer["Freelancer / Seller"]
    Buyer["Peso buyer"]
    NewUser["New user (email sign-up)"]
  end

  subgraph App["PeerlyPay — Next.js"]
    Web["Web app (src/)"]
    API["API routes<br/>(rates, anchor, defindex, faucet)"]
  end

  subgraph Wallets["Wallet layer — Privy"]
    Privy["Embedded Stellar wallet<br/>(email login, no seed phrase)"]
    Faucet["Faucet wallet<br/>(10 USDC on first login)"]
  end

  subgraph Stellar["Stellar ecosystem — Testnet"]
    P2P["P2P Escrow Contract<br/>(Soroban)"]
    Reflector["Reflector SEP-40 Oracle<br/>(live ARS/USD rate)"]
    DeFindex["DeFindex Yield Vault<br/>(10.83% APY)"]
    Friendbot["Friendbot<br/>(XLM for fees)"]
  end

  subgraph Anchor["Anchor layer — SEP-24"]
    SEP10["SEP-10 Auth"]
    SEP24["SEP-24 Interactive deposit/withdraw"]
  end

  subgraph Fiat["Fiat rail — Argentina"]
    QR["Transferencias 3.0 QR<br/>(BCRA instant rail)"]
  end

  Freelancer --> Web
  Buyer --> Web
  NewUser --> Web

  Web --> API
  Web --> Privy
  NewUser --> Privy

  Privy -->|"sign transactions"| P2P
  Privy -->|"deposit / withdraw"| DeFindex
  API -->|"Friendbot + 10 USDC"| Faucet
  Faucet -->|"first login"| NewUser

  P2P -->|"reference_rate(2)"| Reflector
  API --> SEP10 --> SEP24
  Web --> QR
```

PeerlyPay is a mobile-first web app where freelancers and peso buyers trade USDC↔ARS directly, peer-to-peer. A single Soroban contract holds the on-chain logic: escrow, release, dispute, and timeout. The exchange rate is read on-chain via a cross-contract call to the Reflector SEP-40 oracle — not set by the operator. Idle USDC earns 10.83% APY in a DeFindex vault. New users get 10 USDC automatically on first login so they can trade immediately.

---

## 2. What the application does

### 2.1 User roles

| Role | Main actions |
|---|---|
| **Freelancer / Seller** | Sign in with email, post a sell order (USDC → ARS), receive ARS off-chain, confirm payment, get released. |
| **Peso buyer** | Browse marketplace, take an order, scan Transferencias 3.0 QR, send ARS, wait for USDC release. |
| **New user** | Sign in with email → Privy creates a Stellar wallet → Friendbot funds it with XLM → faucet sends 10 USDC automatically. |
| **Yield earner** | Deposit idle USDC into DeFindex vault, earn 10.83% APY, withdraw any time. |

### 2.2 Sell flow (USDC → ARS)

```mermaid
sequenceDiagram
  participant Seller
  participant Web
  participant CTR as P2P Contract
  participant ORC as Reflector Oracle
  participant Buyer

  Seller->>Web: Post sell order (amount, min rate)
  Web->>ORC: reference_rate(2) — cross-contract call
  ORC-->>Web: live ARS/USD (e.g. 1462)
  Web->>CTR: create_order — USDC locked in escrow

  Buyer->>Web: Browse marketplace, pick order
  Web->>CTR: take_order_with_amount
  CTR-->>Web: Order locked, generate QR

  Buyer->>Buyer: Scan Transferencias 3.0 QR, send ARS via bank
  Buyer->>CTR: submit_fiat_payment
  Seller->>CTR: confirm_fiat_payment
  CTR-->>Buyer: USDC released to buyer
  CTR-->>Web: Platform fee (0.5%) to admin
```

### 2.3 Buy flow (ARS → USDC)

```mermaid
sequenceDiagram
  participant Creator
  participant CTR as P2P Contract
  participant Taker
  participant ORC as Reflector Oracle

  Creator->>CTR: create_order (from_crypto=false) — no escrow yet
  Taker->>CTR: take_order — Taker's USDC locked in escrow
  Creator->>Creator: Send ARS off-chain
  Creator->>CTR: submit_fiat_payment
  Taker->>CTR: confirm_fiat_payment
  CTR-->>Creator: USDC released to creator
```

### 2.4 Dispute and timeout

```mermaid
flowchart LR
  A["Trade in flight"] --> B{"Counterparty ghosts?"}
  B -->|"timeout passed"| C["execute_fiat_transfer_timeout\n→ automatic refund"]
  B -->|"dispute raised"| D["dispute_fiat_payment"]
  D --> E["dispute_resolver settles on-chain\nresolve_dispute"]
```

### 2.5 DeFindex earn flow

```mermaid
flowchart LR
  U["User has idle USDC"] --> D["Deposit to DeFindex vault\n/earn page"]
  D --> V["Vault issues dfTokens\n(share of pool)"]
  V --> Y["10.83% APY accruing"]
  Y --> W["Withdraw any time"]
  W --> U2["USDC + yield returned"]
```

### 2.6 SEP-10 + SEP-24 anchor flow

```mermaid
sequenceDiagram
  participant W as User Wallet (Privy)
  participant API as PeerlyPay API
  participant ANC as Stellar Anchor

  W->>API: GET /api/anchor/sep10?account=G...
  API->>ANC: webAuthEndpoint — GET challenge XDR
  ANC-->>W: Unsigned XDR challenge
  W->>W: Sign with Privy embedded wallet
  W->>API: POST /api/anchor/sep10 (signed XDR)
  API->>ANC: POST webAuthEndpoint
  ANC-->>W: JWT token
  W->>API: POST /api/anchor/deposit (JWT + amount)
  API->>ANC: SEP-24 /transactions/deposit/interactive
  ANC-->>W: Popup URL
  W->>W: window.open(popup) — complete deposit
```

### 2.7 New user faucet flow

```mermaid
sequenceDiagram
  participant U as New user
  participant App as WalletButton.tsx
  participant API as /api/faucet
  participant FB as Friendbot
  participant FW as Faucet wallet

  U->>App: Sign in with email
  App->>App: Privy creates Stellar wallet
  App->>App: Check localStorage — first time?
  App->>API: POST /api/faucet { address }
  API->>FB: GET friendbot.stellar.org?addr=...
  FB-->>API: 10,000 XLM funded
  API->>FW: Load faucet account
  FW->>U: Payment 10 USDC
  App-->>U: Toast "10 USDC added to your account!"
```

### 2.8 Application routes

| Route | Description |
|---|---|
| `/` | Landing / home |
| `/marketplace` | Browse open orders (live from contract + demo fallback) |
| `/orders/[id]` | Order detail — real chain data |
| `/trade/confirm` | Live oracle rate, take order |
| `/trade/payment` | Transferencias 3.0 QR + submit payment |
| `/trade/waiting` | Polling for confirmation |
| `/trade/success` | USDC released |
| `/anchor` | SEP-24 anchor discovery + deposit/withdraw |
| `/earn` | DeFindex yield vault — deposit, withdraw, APY |
| `/profile` | User profile, trust score, settings |
| `/wallet/bridge` | Move funds from another app |
| `/api/rates` | Live ARS/USD via contract → Reflector → BCRA |
| `/api/anchor/sep10` | SEP-10 auth proxy (CORS) |
| `/api/anchor/deposit` | SEP-24 deposit proxy |
| `/api/anchor/withdraw` | SEP-24 withdraw proxy |
| `/api/defindex/apy` | Live DeFindex APY |
| `/api/defindex/balance` | User DeFindex vault balance |
| `/api/defindex/deposit` | Build deposit XDR |
| `/api/defindex/withdraw` | Build withdraw XDR |
| `/api/faucet` | Send 10 USDC to new users |

---

## 3. Tech stack

```mermaid
flowchart TB
  subgraph Contracts["Contracts (Rust / Soroban)"]
    SDK["soroban-sdk"]
    P2P["P2P escrow + oracle call"]
  end

  subgraph Client["Client — TypeScript / Next.js"]
    Next["Next.js 16 + React 19"]
    Tailwind["Tailwind v4 + shadcn/ui"]
    StellarSDK["@stellar/stellar-sdk"]
    Privy["@privy-io/react-auth"]
    DeFindexSDK["@defindex/sdk"]
    Bindings["Generated contract bindings"]
    Zustand["zustand (global state)"]
  end

  Next --> StellarSDK
  Next --> Privy
  Next --> DeFindexSDK
  Next --> Bindings
  Next --> Zustand
```

| Layer | Technology | Notes |
|---|---|---|
| **Contract** | Rust + `soroban-sdk` | P2P escrow with Reflector oracle cross-contract call |
| **Web** | Next.js 16 + React 19 + Tailwind v4 | App Router, mobile-first |
| **Wallet** | Privy embedded Stellar wallets | Email login, no seed phrase, real Soroban signing |
| **Rate oracle** | Reflector SEP-40 (cross-contract) | Live ARS/USD, not operator-controlled |
| **Yield** | DeFindex SDK | 10.83% APY vault on testnet |
| **Anchor** | SEP-10 + SEP-24 (full interactive) | Proxied through Next.js API routes to avoid CORS |
| **Fiat rail** | Transferencias 3.0 QR (EMVCo / CRC16) | BCRA instant rail for ARS leg |
| **State** | Zustand | Wallet, balance, demo orders fallback |
| **Deployment** | Vercel | SSR + edge API routes |

---

## 4. Project structure

```
peerlypay/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── rates/route.ts          # GET — contract → Reflector → BCRA → fallback
│   │   │   ├── anchor/
│   │   │   │   ├── info/route.ts       # SEP-1 TOML + SEP-24 /info
│   │   │   │   ├── sep10/route.ts      # SEP-10 auth proxy (GET challenge, POST signed)
│   │   │   │   ├── deposit/route.ts    # SEP-24 deposit proxy
│   │   │   │   └── withdraw/route.ts   # SEP-24 withdraw proxy
│   │   │   ├── defindex/
│   │   │   │   ├── apy/route.ts        # Live APY from DeFindex SDK
│   │   │   │   ├── balance/route.ts    # User vault balance (dfTokens + USDC value)
│   │   │   │   ├── deposit/route.ts    # Build deposit XDR
│   │   │   │   └── withdraw/route.ts   # Build withdraw XDR
│   │   │   └── faucet/route.ts         # POST — Friendbot + 10 USDC to new users
│   │   ├── marketplace/                # Browse open orders
│   │   ├── orders/[id]/                # Order detail (real chain data)
│   │   ├── trade/
│   │   │   ├── confirm/                # Oracle rate + take order
│   │   │   ├── payment/                # Transferencias 3.0 QR
│   │   │   ├── waiting/                # Poll for confirmation
│   │   │   └── success/                # Released
│   │   ├── anchor/                     # SEP-24 anchor page
│   │   ├── earn/                       # DeFindex vault page
│   │   ├── profile/                    # User profile
│   │   ├── wallet/bridge/              # Move funds
│   │   ├── privy-provider.tsx          # Client-only PrivyProvider (ssr:false)
│   │   └── providers.tsx               # App-level providers
│   ├── components/
│   │   ├── trade/
│   │   │   └── Transferencias30QR.tsx  # EMVCo QR (CRC16) for ARS leg
│   │   ├── AnchorCard.tsx              # SEP-10 + SEP-24 interactive flow
│   │   ├── EarnCard.tsx                # DeFindex deposit/withdraw/APY UI
│   │   ├── OrderCard.tsx               # Marketplace order card
│   │   └── WalletButton.tsx            # Sign in / account dropdown + faucet trigger
│   ├── lib/
│   │   ├── contract-config.ts          # Single source of truth for contract ID
│   │   ├── p2p.ts                      # Read path: get_order, reference_rate
│   │   ├── p2p-crossmint.ts            # Write path: take/submit/confirm/create
│   │   ├── privy-wallet.ts             # useStellarWallet hook (Privy)
│   │   ├── sep24.ts                    # SEP-10 + SEP-24 helpers
│   │   ├── defindex.ts                 # DeFindex client helpers
│   │   ├── rates.ts / rates-server.ts  # Live rate (oracle + BCRA)
│   │   └── store.ts                    # Zustand store + demo orders fallback
│   └── contexts/
│       └── UserContext.tsx             # User session (localStorage)
│
├── contracts/contracts/p2p/src/
│   ├── contract.rs / lib.rs            # Entrypoints + wiring
│   ├── core/order.rs                   # Order lifecycle state machine
│   ├── core/oracle.rs                  # Reflector SEP-40 cross-contract call
│   ├── core/dispute.rs                 # Dispute resolution
│   ├── core/admin.rs                   # Admin / pause
│   └── tests/test.rs                   # 20/20 passing
│
└── docs/
    ├── architecture.md                 # This file
    └── hackathon/
        ├── SUBMISSION_CHECKLIST.md
        ├── CONTEXT.md
        └── DEMO_SCRIPT.md
```

---

## 5. The P2P escrow contract

The contract is the only entity that ever holds USDC during a trade. No company wallet ever touches user funds.

```mermaid
flowchart TB
  Admin -->|"initialize, pause/unpause, set_oracle"| CTR["P2P Contract"]
  Creator -->|"create_order"| CTR
  Taker -->|"take_order_with_amount"| CTR
  CTR -->|"escrow USDC"| CTR
  Buyer -->|"submit_fiat_payment"| CTR
  Seller -->|"confirm_fiat_payment"| CTR
  CTR -->|"release USDC"| Taker
  CTR -->|"platform fee 0.5%"| Admin
  CTR -->|"reference_rate(2)"| Reflector["Reflector Oracle"]
```

### Contract entrypoints

| Function | Role |
|---|---|
| `initialize(admin, fee_bps, oracle)` | Deploy: set admin, platform fee (50 bps = 0.5%), Reflector oracle address |
| `pause` / `unpause` | Admin-gated circuit breaker |
| `create_order(from_crypto, amount, min_rate)` | Lock USDC in escrow; validates rate against oracle |
| `create_order_cli(...)` | Same but callable from CLI scripts |
| `cancel_order(order_id)` | Creator cancels before taken; returns USDC |
| `take_order(order_id)` | Taker locks in at the current rate |
| `take_order_with_amount(order_id, amount)` | Partial fill; leftover reopens as a new order |
| `submit_fiat_payment(order_id)` | Paying side proves off-chain ARS sent |
| `execute_fiat_transfer_timeout(order_id)` | Auto-refund if counterparty ghosts past timeout |
| `confirm_fiat_payment(order_id)` | Receiving side confirms → USDC released + fee collected |
| `dispute_fiat_payment(order_id)` | Raise a dispute |
| `resolve_dispute(order_id, winner)` | `dispute_resolver` settles on-chain |
| `get_order(order_id)` | Read order state |
| `get_order_count()` | Total orders |
| `get_config()` | Read admin + fee config |
| `set_oracle(oracle_id)` | Admin: update oracle address |
| `get_oracle()` | Read current oracle |
| `reference_rate(asset_code)` | **Cross-contract call** into Reflector → live ARS/USD |

### Deployed contract

| | |
|---|---|
| **Contract ID** | `CAEHRNAPSRSFYGG7BRTZY3XX2XEYSCOJUHIJUYO2FYRJATYUXDFA5JQD` |
| **Network** | Stellar Testnet (`Test SDF Network ; September 2015`) |
| **Oracle** | Reflector SEP-40 `CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W` |
| **Platform fee** | 50 bps (0.5%) |
| **Seed orders** | 3 live orders (5 USDC @ 1462, 10 USDC @ 1465, 5 USDC @ 1468 ARS/USDC) |
| **Tests** | `cargo test -p p2p` → **20/20 passing** |

---

## 6. Rate oracle

Most P2P ramps quote a rate from a backend the operator controls. PeerlyPay reads it **on-chain**.

```mermaid
flowchart LR
  API["/api/rates"] -->|"1st"| CTR["P2P Contract\nreference_rate(2)"]
  CTR -->|"cross-contract call"| REF["Reflector SEP-40 Oracle"]
  REF --> CTR
  CTR --> API
  API -->|"fallback 2"| REF2["Direct Reflector call"]
  API -->|"fallback 3"| BCRA["BCRA official API"]
  API -->|"fallback 4"| CONST["Constant (1462)"]
```

- `reference_rate(2)` passes asset code `2` = ARS to Reflector
- Reflector returns the live ARS/USD price; the contract inverts it to ARS-per-USD
- The frontend always tries the contract first — rate is verifiable on-chain by anyone
- BCRA official rate is shown alongside for transparency (spread visibility)

---

## 7. DeFindex yield vault

```mermaid
flowchart LR
  subgraph Client["Client — defindex.ts"]
    D["defindexDeposit(wallet, amount)"]
    W["defindexWithdraw(wallet, amount)"]
    B["defindexGetBalance(address)"]
    A["defindexGetApy()"]
  end

  subgraph API["API routes"]
    DEP["/api/defindex/deposit"]
    WIT["/api/defindex/withdraw"]
    BAL["/api/defindex/balance"]
    APY["/api/defindex/apy"]
  end

  subgraph SDK["DeFindex SDK"]
    VAULT["Vault CBMVK2JK…WHNZ\n(testnet)"]
  end

  D --> DEP --> SDK
  W --> WIT --> SDK
  B --> BAL --> SDK
  A --> APY --> SDK
  SDK --> VAULT
```

- API routes build the Soroban XDR using the DeFindex SDK
- Client receives the XDR, signs it with Privy, submits to the network
- `VaultBalanceResponse: { dfTokens: number; underlyingBalance: number[] }`
- Live APY: **10.83%** (queried from `sdk.getVaultAPY()`)

---

## 8. Faucet system

New users get 10 USDC on first login so they can trade immediately — no need to find a faucet or fund externally.

| | |
|---|---|
| **Faucet wallet** | `GCHL5GA4JTML4NNRIVXBJ3ER37HEUOCRL4664NPZQCNJ3LAEST6UKBKK` |
| **Amount** | 10 USDC per new user |
| **XLM** | Friendbot called first (for transaction fees) |
| **Guard** | `localStorage` key `peerlypay_faucet_<address>` — never sends twice |
| **Trigger** | Automatically when `stellarAddress` appears in `WalletButton.tsx` |

---

## 9. Security model

Soroban removes some bug classes by design (no `delegatecall`, explicit authorization). What PeerlyPay guards additionally:

- **No fund custody:** USDC moves from creator directly into the contract escrow, never into a PeerlyPay wallet
- **Authorization** on every privileged entrypoint (`require_auth`, admin-gated)
- **Timeout protection:** `execute_fiat_transfer_timeout` prevents funds being stuck indefinitely
- **On-chain arbitration:** `dispute_resolver` address settles disputes — no centralized admin decision
- **Rate integrity:** rate comes from a cross-contract call into an immutable oracle, not an operator-set value
- **Client-side signing:** Privy signs transactions in the browser; private keys never reach the server
- **CORS proxy:** anchor API calls proxied through Next.js routes — anchor JWTs never exposed client-side

---

## 10. Environment variables

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Public | Privy app ID — get one at privy.io |
| `NEXT_PUBLIC_P2P_CONTRACT_ID` | Public | P2P escrow contract (testnet) |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Public | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | Public | `Test SDF Network ; September 2015` |
| `NEXT_PUBLIC_REFLECTOR_FIAT_ORACLE_ID` | Public | Reflector SEP-40 oracle address |
| `DEFINDEX_API_KEY` | Server | DeFindex API key — get one at api.defindex.io/register |
| `FAUCET_SECRET_KEY` | Server | Secret key of the faucet wallet — never expose publicly |

---

## 11. Known limitations (honest disclosure)

| Area | Status |
|---|---|
| **USDC trustline** | `checkUSDCTrustline` returns `true` — not checked on-chain |
| **No backend** | Trade history, profile, reputation live in `localStorage` + Zustand |
| **Demo orders** | When chain has no orders, marketplace shows labeled demo orders |
| **Faucet capacity** | Faucet wallet has a fixed balance — refill from Circle testnet faucet as needed |
| **Mainnet** | Contract + app are testnet-only; Reflector mainnet oracle address is known |

---

## 12. References

- [Stellar Developers](https://developers.stellar.org) — Soroban, RPC, SEPs
- [soroban-sdk](https://crates.io/crates/soroban-sdk) — Rust contract SDK
- [Privy](https://privy.io) — embedded Stellar wallets, email login
- [Reflector Oracle](https://reflector.network) — SEP-40 fiat oracle
- [DeFindex](https://defindex.io) — yield vaults on Stellar
- [SEP-10](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md) — Web Auth
- [SEP-24](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md) — Interactive anchor deposit/withdraw
- [Transferencias 3.0](https://www.bcra.gob.ar/MediosPago/Transferencias_3.0.asp) — BCRA instant rail (EMVCo QR)
- [DeFindex SDK docs](https://docs.defindex.io)
- [Stellar Expert testnet](https://stellar.expert/explorer/testnet) — contract explorer
