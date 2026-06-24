# Stellar / Soroban Security Checklist

## 8 core vulnerability categories

### 1. Missing authorization
Every privileged entrypoint must call `require_auth()` as the first line.

```rust
pub fn cancel_order(e: Env, caller: Address, order_id: u64) -> Result<(), ContractError> {
    caller.require_auth(); // must be first
    // ...
}
```

### 2. Reinitialization attack
Guard every `initialize()` with a single-use check:

```rust
if e.storage().instance().has(&DataKey::Config) {
    return Err(ContractError::AlreadyInitialized);
}
```

### 3. Arbitrary contract calls
Don't call addresses provided by users as if they were trusted contracts. Maintain an allowlist of trusted contract addresses or validate return values.

### 4. Integer overflow / underflow
Use checked arithmetic everywhere — never raw `+`, `-`, `*`:

```rust
let total = a.checked_add(b).ok_or(ContractError::Overflow)?;
let fee = amount.checked_mul(fee_bps as i128).ok_or(ContractError::Overflow)?
               .checked_div(10_000).ok_or(ContractError::DivisionError)?;
```

Enable `overflow-checks = true` in `Cargo.toml` release profile.

### 5. Storage key collisions
Use a typed enum for all storage keys — never raw strings or integers:

```rust
#[contracttype]
pub enum DataKey {
    Config,
    OrderCount,
    Order(u64),     // per-order key
    Oracle,
}
```

### 6. State race conditions
Multi-step operations must execute atomically within a single transaction. The contract's synchronous execution model prevents classical reentrancy, but state machines (e.g. order status) must be validated at the start of every function.

### 7. TTL / archival vulnerabilities
Critical state in `persistent()` storage will be archived if TTL expires. Extend TTL proactively after every write:

```rust
e.storage().persistent().extend_ttl(&key, 86_400, 518_400);
e.storage().instance().extend_ttl(86_400, 518_400);
```

**Impact:** archived orders = frozen user funds.

### 8. Cross-contract return value validation
Never trust data returned from external contracts without sanity checks (price freshness, range checks, etc.):

```rust
let price_data = oracle.lastprice(&asset).ok_or(ContractError::OracleUnavailable)?;
if price_data.price <= 0 { return Err(ContractError::OracleUnavailable); }
```

## Soroban architecture advantages

- No `delegatecall` equivalent → no proxy/storage collision attacks
- Synchronous execution → classical reentrancy impossible
- Explicit `require_auth()` model → no ambient authority

## Static analysis tools

| Tool | What it checks |
|------|---------------|
| [Scout Soroban](https://github.com/CoinFabrik/scout-soroban) | 23 vulnerability detectors, VSCode extension |
| [OZ Security Detectors SDK](https://github.com/OpenZeppelin/soroban-security-detectors-sdk) | Custom detector framework |

## Formal verification

| Tool | Approach |
|------|---------|
| [Certora Sunbeam](https://docs.certora.com/en/latest/docs/sunbeam/index.html) | WASM-level formal verification |
| [Runtime Verification Komet](https://runtimeverification.com/blog/introducing-komet-smart-contract-testing-and-verification-tool-for-soroban-created-by-runtime-verification) | Soroban testing + verification |

## Bug bounty programs

- [Immunefi — Stellar](https://immunefi.com/bug-bounty/stellar/) — up to $250K (core + Soroban)
- [Immunefi — OpenZeppelin Stellar](https://immunefi.com/bug-bounty/openzeppelin-stellar/) — up to $25K

## Audit bank

SDF's [Soroban Audit Bank](https://stellar.org/grants-and-funding/soroban-audit-bank) — $3M+ deployed, 43+ audits funded.
Partners: OtterSec, Veridise, CoinFabrik, Runtime Verification, Halborn, Zellic, Certora, Coinspect, QuarksLab.

## Pre-deploy checklist

- [ ] Every state-changing function calls `require_auth()`
- [ ] `initialize()` has duplicate-call guard
- [ ] All arithmetic uses `.checked_*()` operators
- [ ] `overflow-checks = true` in release profile
- [ ] Storage keys use typed enum (no raw strings/numbers)
- [ ] TTL extended after every `persistent()` and `instance()` write
- [ ] Oracle data validated (non-zero, fresh timestamp)
- [ ] Pause mechanism blocks new exposure but allows fund exits
- [ ] Tests cover all negative / unauthorized paths
