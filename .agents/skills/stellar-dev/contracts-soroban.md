# Soroban Smart Contract Development

## When to use Soroban

Use when you need custom on-chain logic, DeFi primitives, complex authorization, or state management beyond basic account operations.

**Language:** Rust (primary). AssemblyScript via `as-soroban-sdk` and Solidity via Hyperledger Solang exist but are less mature.

## Architecture

Contracts compile to WASM and run in a host-guest sandbox. Key constraints:
- Requires `#![no_std]`
- 64 KB WASM size limit — use `opt-level = "z"` + LTO to reduce size; split contracts if needed
- Restricted heap allocation

## Setup

```bash
stellar contract init my-contract   # scaffolds workspace with optimized Cargo config
```

Cargo.toml profile for release:
```toml
[profile.release]
opt-level = "z"
overflow-checks = true
debug = 0
strip = "symbols"
panic = "abort"
codegen-units = 1
lto = true
```

## Constructors (Protocol 22+)

Named `__constructor`, run atomically at deployment — eliminates separate initialization transactions and reduces front-running risk:

```rust
pub fn __constructor(e: Env, admin: Address) {
    e.storage().instance().set(&DataKey::Admin, &admin);
}
```

## Storage types

| Type | Lifetime | Cost | Use for |
|------|----------|------|---------|
| `instance()` | Contract lifetime | Medium | Contract globals (config, admin) |
| `persistent()` | Survives archival with per-key TTL | Medium | Critical state (orders, balances) |
| `temporary()` | Auto-deleted on expiry | Cheapest | Ephemeral data (nonces, locks) |

**Always extend TTL proactively** — archived entries freeze user funds:

```rust
// After every write to persistent storage:
e.storage().persistent().extend_ttl(&key, THRESHOLD_LEDGERS, EXTEND_TO_LEDGERS);

// For instance storage (do after every instance write):
e.storage().instance().extend_ttl(THRESHOLD, EXTEND_TO);

// ~5 days threshold → ~30 days extension (5 s/ledger):
const TTL_THRESHOLD: u32 = 86_400;
const TTL_LEDGERS: u32 = 518_400;
```

## Authorization

```rust
// Single caller auth:
caller.require_auth();

// Auth scoped to specific args (more granular):
caller.require_auth_for_args(args);
```

## Cross-contract calls

```rust
contractimport!(file = "path/to/other_contract.wasm");
let client = other_contract::Client::new(&e, &contract_address);
let result = client.some_method(&arg);
```

## Events

```rust
#[contractevent]
pub struct OrderCreated {
    pub order_id: u64,
    pub creator: Address,
}
// Emit:
OrderCreated { order_id, creator }.publish(&e);
```

## Error handling

```rust
#[contracterror]
#[derive(Copy, Clone, PartialEq)]
pub enum ContractError {
    Unauthorized = 1,
    OrderNotFound = 2,
    // ...
}
```

## Build & deploy

```bash
# Build (correct command):
stellar contract build

# Install WASM on network:
stellar contract install --network testnet --source admin --wasm target/wasm32-unknown-unknown/release/contract.wasm

# Deploy:
stellar contract deploy --network testnet --source admin --wasm-hash <HASH>

# Initialize:
stellar contract invoke --network testnet --source admin --id <CONTRACT_ID> \
  -- initialize --admin <ADDR> ...
```

## Integer safety

Always use checked arithmetic — overflow panics are WASM traps:

```rust
let result = a.checked_add(b).ok_or(ContractError::Overflow)?;
let result = a.checked_mul(b).ok_or(ContractError::Overflow)?;
let result = a.checked_div(b).ok_or(ContractError::DivisionError)?;
```
