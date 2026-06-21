# PeerlyPay — Build, Test & Deploy Guide (Testnet + Mainnet)

This is the copy-pasteable runbook for building, testing, and deploying the PeerlyPay
`p2p` Soroban escrow contract, configuring its **on-chain Reflector price oracle**
(`set_oracle`), and wiring the deployed contract into the Next.js frontend.

It covers both networks:

- **Testnet** — to reproduce our current live deployment, or to stand up your own
  admin-owned instance for the demo (recommended for the hackathon).
- **Mainnet** — for the real, value-bearing deployment.

> **Why everything runs through WSL.** The team's Windows host has **no C linker**
> (no MSVC/gcc), so `cargo`/`stellar` fail natively when compiling the contract
> (the Wasm build still links host-side dependencies). All build/test/deploy steps
> must run inside **WSL Ubuntu**, which has Rust 1.96, `cc`/`gcc`, and the Stellar
> CLI. The Windows side is only used to edit files and run the Next.js dev server.

---

## 0. Reference values (verified)

| Thing | Value |
| --- | --- |
| Current live **testnet** p2p contract | `CC2CA5LKXWRSYMYKFO66MJPM2AFPO7UB5C2AKW2HYPARKNS426CD76TJ` |
| Reflector fiat oracle — **testnet** | `CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W` |
| Reflector fiat oracle — **mainnet** | `CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC` |
| ARS currency code (for `reference_rate`) | `2` (also: `1`=EUR, `5`=GBP) |
| Wasm output path | `target/wasm32v1-none/release/p2p.wasm` |
| Build target | `wasm32v1-none` |
| `soroban-sdk` | `23.1.1` |
| Test status | `cargo test -p p2p` → **20/20 pass** |

The `initialize` signature (from `contracts/contracts/p2p/src/contract.rs`):

```
initialize(admin, dispute_resolver, pauser, token, max_duration_secs, filler_payment_timeout_secs)
```

Default operational params we use:

- `max_duration_secs = 2592000` (30 days)
- `filler_payment_timeout_secs = 1800` (30 min)

`set_oracle(caller, oracle)` is **admin-only** and requires `caller == config.admin`.
`reference_rate(currency_code)` then performs a cross-contract call into Reflector
and returns the live ARS-per-USD rate (≈1461 on testnet, vs the old `MOCK_RATE=1485`).

---

## ⚠️ Mainnet warnings — read before Section 4

Mainnet moves **real funds**. None of the testnet conveniences apply.

1. **The current testnet admin is a THROWAWAY key.** It must **never** be used on
   mainnet. Generate a fresh, securely-stored key (ideally hardware-backed) for the
   mainnet `admin`.
2. **Pick a proper `admin` / `dispute_resolver` / `pauser`.** The `dispute_resolver`
   has unilateral power over `resolve_dispute` (it decides which side of a disputed
   escrow gets the USDC). Treat it like a custodial key. For a real launch these
   should be distinct, controlled addresses — not all defaulted to one hot key.
3. **No friendbot on mainnet.** You must fund accounts with **real XLM** (deploy,
   storage rent, and invoke fees are all paid in XLM).
4. **Use the real USDC SAC on mainnet.** The escrow `token` must be the **Circle
   USDC on Stellar** Stellar Asset Contract (SAC) — issuer
   `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`. Do **not** copy a
   testnet token id. Derive/confirm the canonical USDC SAC id for your network with
   `stellar contract id asset` (Section 4.4) before initializing — `token` is
   immutable in `initialize`.
5. **Confirm Reflector mainnet ARS support before relying on it.** Our contract reads
   the rate live via cross-contract call; if the mainnet Reflector fiat oracle does
   not currently list `ARS`, `reference_rate(2)` will error with
   `UnsupportedCurrency`/`OracleUnavailable` and the frontend will fall through to its
   backup chain (direct Reflector read → BCRA official API → constant). Verify with a
   read (Section 4.7) **before** depending on the on-chain path in a live demo.

---

## 1. WSL prerequisites (one-time)

Run these **inside WSL Ubuntu** (`wsl` from PowerShell drops you into bash).

```bash
# Rust toolchain (1.96+) and the Wasm target
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustup target add wasm32v1-none

# Linker + build essentials (this is what the Windows host lacks)
sudo apt-get update && sudo apt-get install -y build-essential curl

# Stellar CLI (provides `stellar contract build/deploy/invoke/bindings`)
cargo install --locked stellar-cli

# Sanity check
rustc --version          # expect 1.96.x
stellar --version
```

### Running scripts/Makefile targets from PowerShell

The repo lives on the Windows drive. From PowerShell, invoke WSL bash with an
**absolute `/mnt/c/...` path**. Use the WSL `bash` directly — **Git Bash mangles
`/mnt` paths**, so don't run these through Git Bash:

```powershell
# Pattern: run a contracts script via WSL
wsl bash "/mnt/c/Users/usuario/peerly pay/peerlypay/contracts/scripts/run_simple_p2p_flow.sh"

# Or drop into the contracts dir and run make targets
wsl bash -lc "cd '/mnt/c/Users/usuario/peerly pay/peerlypay/contracts' && make p2p-build"
```

All command blocks below assume you are **inside the WSL shell** in the
`contracts/` directory unless stated otherwise:

```bash
cd "/mnt/c/Users/usuario/peerly pay/peerlypay/contracts"
```

---

## 2. Build & test the contract

```bash
# From: contracts/

# 1) Run the full Rust test suite (20/20, incl. the 2 oracle tests)
cargo test -p p2p

# 2) Compile to Wasm (release). `stellar contract build` wraps this, but the
#    explicit cargo form is the underlying command:
cargo build --target wasm32v1-none --release
#    -> produces target/wasm32v1-none/release/p2p.wasm

# Equivalent via Makefile (also verifies the wasm path exists):
make p2p-build
```

If `cargo test` or the build fails with a linker error (`cc not found`,
`linker 'cc' failed`), you are **not** in WSL — re-enter with `wsl` and retry.

---

## 3. Deploy to TESTNET (reproduce, or stand up your own)

The currently-deployed testnet instance uses a **throwaway admin and has no seeded
orders**. For the demo, deploy a fresh instance from **your own** funded admin
identity so you control the keys and can seed the orderbook.

### 3.1 Create & fund a testnet admin key (friendbot)

```bash
# From: contracts/
stellar keys generate admin --network testnet

# Fund it via friendbot (testnet only)
ADMIN_ADDR=$(stellar keys address admin)
curl -sSf "https://friendbot.stellar.org?addr=$ADMIN_ADDR" >/dev/null
echo "Funded admin: $ADMIN_ADDR"
```

Optionally bootstrap the helper roles (`creator`, `filler`) and USDC trustlines used
by the seed step:

```bash
make wallets-bootstrap-p2p NETWORK=testnet
```

### 3.2 Deploy

You can do install + deploy + init in one shot with the Makefile:

```bash
make p2p-quickstart NETWORK=testnet SOURCE=admin P2P_ALIAS=p2p
```

…or step through it manually (matches what `p2p-quickstart` runs):

```bash
# Install the Wasm, capture the hash
WASM_HASH=$(stellar contract install \
  --network testnet --source admin \
  --wasm target/wasm32v1-none/release/p2p.wasm)
echo "wasm hash: $WASM_HASH"

# Deploy an instance from that hash
CONTRACT_ID=$(stellar contract deploy \
  --network testnet --source admin \
  --wasm-hash "$WASM_HASH" \
  --alias p2p)
echo "p2p contract id: $CONTRACT_ID"
```

### 3.3 Initialize

`dispute_resolver` and `pauser` default to the admin address if you omit them.
On testnet that's fine. The USDC SAC below is the testnet token id used by our
Makefile default (`TOKEN_CONTRACT_ID`).

```bash
stellar contract invoke \
  --network testnet --source admin \
  --id "$CONTRACT_ID" \
  -- initialize \
  --admin "$ADMIN_ADDR" \
  --dispute_resolver "$ADMIN_ADDR" \
  --pauser "$ADMIN_ADDR" \
  --token CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA \
  --max_duration_secs 2592000 \
  --filler_payment_timeout_secs 1800
```

> Makefile equivalent (resolves the admin alias automatically):
> ```bash
> make p2p-init NETWORK=testnet SOURCE=admin
> ```

### 3.4 Wire the Reflector oracle (`set_oracle`) — the headline feature

Point the contract at the **testnet** Reflector fiat oracle. Only the `admin` may
call this.

```bash
stellar contract invoke \
  --network testnet --source admin \
  --id "$CONTRACT_ID" \
  -- set_oracle \
  --caller "$ADMIN_ADDR" \
  --oracle CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W
```

### 3.5 Verify the live rate

```bash
# Confirm the oracle is stored
stellar contract invoke --network testnet --source admin \
  --id "$CONTRACT_ID" -- get_oracle

# Live cross-contract read: ARS per USD (code 2). Expect ~1461.
stellar contract invoke --network testnet --source admin \
  --id "$CONTRACT_ID" -- reference_rate --currency_code 2

# Sanity-check config
stellar contract invoke --network testnet --source admin \
  --id "$CONTRACT_ID" -- get_config
```

If `reference_rate` returns a value near **1461**, the on-chain oracle path is live.

### 3.6 Seed orders

The deployed instance starts with **zero orders**. Seed an ARS orderbook so the
marketplace UI has something real to show. This uses the `creator`/`filler` aliases
bootstrapped in 3.1.

```bash
# 10 orders around ~1475 ARS/USDC
make p2p-seed-orders NETWORK=testnet

# (or a lighter 3-order set)
make p2p-seed-orders-small NETWORK=testnet
```

---

## 4. Deploy to MAINNET

Re-read the **Mainnet warnings** above. Every value below must be chosen
deliberately — there are no throwaway defaults on mainnet.

### 4.1 Configure the mainnet network (if not already)

```bash
stellar network add mainnet \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm \
  --network-passphrase "Public Global Stellar Network ; September 2015"
```

> Use any production-grade Soroban RPC provider you trust; the passphrase above is
> the canonical mainnet passphrase.

### 4.2 Create a fresh, secure admin key — fund with REAL XLM

```bash
# DO NOT reuse the testnet throwaway admin.
stellar keys generate mainnet-admin --network mainnet
ADMIN_ADDR=$(stellar keys address mainnet-admin)
echo "Mainnet admin: $ADMIN_ADDR"
# -> Send real XLM to $ADMIN_ADDR from an exchange/wallet. No friendbot exists.
```

For a real launch, also provision distinct `dispute_resolver` and `pauser`
addresses and capture them:

```bash
DISPUTE_RESOLVER_ADDR=G...   # the address authorized to resolve disputed escrows
PAUSER_ADDR=G...             # the address authorized to pause/unpause
```

### 4.3 Build & install (same Wasm)

```bash
# From: contracts/  (inside WSL)
cargo test -p p2p          # confirm 20/20 before shipping value-bearing code
make p2p-build             # or: cargo build --target wasm32v1-none --release

WASM_HASH=$(stellar contract install \
  --network mainnet --source mainnet-admin \
  --wasm target/wasm32v1-none/release/p2p.wasm)
echo "mainnet wasm hash: $WASM_HASH"
```

### 4.4 Determine the real USDC SAC id

The escrow `token` must be the **Circle USDC on Stellar** Stellar Asset Contract.
Derive its contract id deterministically from the asset and confirm it before use:

```bash
# Circle USDC issuer on Stellar mainnet
stellar contract id asset \
  --asset USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN \
  --network mainnet
# -> prints the canonical mainnet USDC SAC contract id. Use THIS as --token.

USDC_SAC=<paste-output-here>
```

> `token` is set once in `initialize` and cannot be changed afterward. Get it right.

### 4.5 Deploy

```bash
CONTRACT_ID=$(stellar contract deploy \
  --network mainnet --source mainnet-admin \
  --wasm-hash "$WASM_HASH" \
  --alias p2p-mainnet)
echo "MAINNET p2p contract id: $CONTRACT_ID"
```

### 4.6 Initialize (real roles, real token)

```bash
stellar contract invoke \
  --network mainnet --source mainnet-admin \
  --id "$CONTRACT_ID" \
  -- initialize \
  --admin "$ADMIN_ADDR" \
  --dispute_resolver "$DISPUTE_RESOLVER_ADDR" \
  --pauser "$PAUSER_ADDR" \
  --token "$USDC_SAC" \
  --max_duration_secs 2592000 \
  --filler_payment_timeout_secs 1800
```

### 4.7 Set the MAINNET Reflector oracle & verify ARS

```bash
stellar contract invoke \
  --network mainnet --source mainnet-admin \
  --id "$CONTRACT_ID" \
  -- set_oracle \
  --caller "$ADMIN_ADDR" \
  --oracle CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC

# CONFIRM ARS is supported on the mainnet oracle BEFORE relying on it:
stellar contract invoke \
  --network mainnet --source mainnet-admin \
  --id "$CONTRACT_ID" -- reference_rate --currency_code 2
```

- A sensible ARS-per-USD value (currently in the ~1400s) means the on-chain path is
  live on mainnet.
- An error (`UnsupportedCurrency` / `OracleUnavailable`) means the mainnet Reflector
  fiat oracle does not list ARS right now. The contract is still safe to use — the
  **frontend** will fall through its backup chain (direct Reflector → BCRA official
  API → constant) — but do not claim the on-chain rate is live in the demo until this
  read succeeds.

### 4.8 Seed orders on mainnet (optional)

The `make p2p-seed-*` targets call friendbot and are **testnet-only**
(`check-testnet` guards them). To seed a mainnet orderbook you must create/fund real
`creator`/`filler` accounts with real XLM + USDC trustlines, then invoke
`create_order` manually (see `make p2p-create-order` for the exact CLI shape). Most
mainnet deployments should let **real users** create the first orders rather than
seeding.

---

## 5. Wire the deployed contract into the frontend

After deploying (testnet or mainnet), update the app so reads/writes hit your new
contract id and the correct oracle.

### 5.1 Regenerate the TypeScript bindings

Regenerate the typed client into the app's bindings package
(`src/contracts/p2p/src/index.ts`). This also refreshes the `networks` constant
embedded in the bindings.

```bash
# Run inside WSL, from the repo root or contracts/
stellar contract bindings typescript \
  --network testnet \
  --contract-id "$CONTRACT_ID" \
  --output-dir "/mnt/c/Users/usuario/peerly pay/peerlypay/src/contracts/p2p" \
  --overwrite
```

For mainnet, swap `--network mainnet` and your mainnet `$CONTRACT_ID`.

> The generated `index.ts` exports `networks.testnet.contractId`. The app does **not**
> rely on that constant for runtime resolution — it uses
> `src/lib/contract-config.ts` + the `NEXT_PUBLIC_P2P_CONTRACT_ID` env var (see
> below) so the read and write paths always resolve to the **same** contract. Keep
> both in sync.

### 5.2 Update `src/lib/contract-config.ts`

This file is the single source of truth for the deployed contract id (it fixed a
real bug where reads and writes diverged to different contracts). Update the fallback
to your new id:

```ts
// src/lib/contract-config.ts
export const DEFAULT_P2P_CONTRACT_ID =
  '<YOUR_NEW_CONTRACT_ID>'; // testnet or mainnet
```

### 5.3 Update `.env.example` and your local `.env`

Set the contract id, RPC, passphrase, and the **Reflector oracle id for the matching
network**:

```dotenv
# .env.example / .env.local
NEXT_PUBLIC_P2P_CONTRACT_ID=<YOUR_NEW_CONTRACT_ID>

# Testnet:
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_REFLECTOR_FIAT_ORACLE_ID=CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W

# Mainnet (swap these in for a mainnet deploy):
# NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-rpc.mainnet.stellar.gateway.fm
# NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
# NEXT_PUBLIC_REFLECTOR_FIAT_ORACLE_ID=CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC
```

`NEXT_PUBLIC_REFLECTOR_FIAT_ORACLE_ID` is the **direct** oracle used as a fallback
when the app reads the ARS/USD rate outside our contract. Keep it pointed at the same
network's Reflector oracle that you passed to `set_oracle`.

### 5.4 Verify end-to-end from the app

Start the Next.js dev server on the Windows side (`npm run dev`) and hit the rate
endpoint:

```
GET /api/rates
-> { usdArs, source: "contract", contract, reflector, bcraOfficial, asOf }
```

`source: "contract"` with `contract ≈ 1461` confirms the frontend is reading the live
rate **through your deployed contract's `reference_rate`** (its primary path), with
direct-Reflector / BCRA / constant as documented fallbacks.

---

## 6. Quick reference — full testnet reproduce, top to bottom

```bash
# Inside WSL, from contracts/
cargo test -p p2p                                   # 20/20

stellar keys generate admin --network testnet
ADMIN_ADDR=$(stellar keys address admin)
curl -sSf "https://friendbot.stellar.org?addr=$ADMIN_ADDR" >/dev/null
make wallets-bootstrap-p2p NETWORK=testnet

make p2p-quickstart NETWORK=testnet SOURCE=admin    # build+install+deploy+init+seed
# capture the printed contract id as $CONTRACT_ID, then:

stellar contract invoke --network testnet --source admin --id "$CONTRACT_ID" \
  -- set_oracle --caller "$ADMIN_ADDR" \
  --oracle CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W

stellar contract invoke --network testnet --source admin --id "$CONTRACT_ID" \
  -- reference_rate --currency_code 2               # expect ~1461

# Then update src/lib/contract-config.ts + .env, regenerate bindings (Section 5).
```

---

## 7. Honest status notes

- The **on-chain Reflector oracle** path (`set_oracle` → `reference_rate` → live
  cross-contract read) is **real and verified** on testnet (contract=1461,
  reflector=1461.92, BCRA=1461). It replaced the previous hardcoded `MOCK_RATE=1485`.
- **Mainnet Reflector ARS support is not yet confirmed by us** — verify it live
  (Section 4.7) before depending on the on-chain rate in a mainnet demo.
- `make p2p-seed-*` is **testnet-only** (friendbot-guarded).
- An older **Trustless-Work escrow crate** exists in the repo (`contracts/contracts/escrow`)
  but is **not** wired to the app; the live contract is `p2p`.
- The frontend's interactive **SEP-24** signed deposit/withdraw is still scaffolded
  (discovery/info is live), the trustline check (`checkUSDCTrustline`) is a stub
  returning `true`, and there is no backend (bank details / maker names / reputation
  shown in some screens are placeholder, state lives in localStorage/Zustand). None
  of these affect the deploy steps above, but they're disclosed here for accuracy.
