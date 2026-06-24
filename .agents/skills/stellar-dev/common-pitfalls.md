# Common Pitfalls on Stellar / Soroban

15 frequent issues and how to fix them.

## 1. Wrong build command for Soroban contracts

**Wrong:** `cargo build --target wasm32-unknown-unknown --release`  
**Right:** `stellar contract build`

The Stellar CLI command handles the target, optimization flags, and strips debug symbols correctly.

## 2. TTL not extended → data archived → funds frozen

After every `persistent()` write, extend TTL:

```rust
let key = DataKey::Order(order.order_id);
e.storage().persistent().set(&key, &order);
e.storage().persistent().extend_ttl(&key, 86_400, 518_400);
```

Do the same for `instance()` after every config write.

## 3. Using `instance()` for per-order data

`instance()` storage has a single shared TTL and a practical size limit (~140 entries). Each unique order or user record must go in `persistent()` with its own TTL key.

## 4. Network passphrase mismatch

Transactions signed with the wrong passphrase are silently rejected. Always align wallet, CLI, and app:

```typescript
const PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE
  ?? 'Test SDF Network ; September 2015'; // testnet
```

## 5. Account not funded before use

- Testnet: use Friendbot (`https://friendbot.stellar.org?addr=<ADDRESS>`)
- Mainnet: fund from an existing account first

## 6. Missing trustline before asset transfer

Asset transfers fail with `op_no_trust` if the recipient has no trustline. Check and establish before sending:

```typescript
const account = await server.loadAccount(address);
const hasTrust = account.balances.some(b => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER);
if (!hasTrust) {
  // build change_trust operation before the transfer
}
```

## 7. Stale sequence number

Never reuse account state across multiple transaction builds. Always reload:

```typescript
const account = await server.loadAccount(publicKey); // fresh every time
const tx = new TransactionBuilder(account, { fee, networkPassphrase }).add(...).build();
```

## 8. Not simulating Soroban transactions

Soroban transactions require simulation to populate resource usage and auth entries:

```typescript
const sim = await server.simulateTransaction(tx);
if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
const readyTx = rpc.assembleTransaction(tx, sim).build();
```

## 9. Skipping `require_auth()` on privileged functions

Every state-changing function that should be caller-restricted must call `caller.require_auth()` as the first line. Missing this allows anyone to invoke it.

## 10. Unbounded loops in contracts

Loops over user-supplied lengths can exhaust compute budget and cause transaction failure. Always cap iterations or use pagination patterns.

## 11. Ignoring `overflow-checks = true`

Without `overflow-checks = true` in Cargo.toml profile, integer overflow silently wraps. In contracts this can drain funds. Always use checked arithmetic AND the Cargo flag.

## 12. Reinitialization not guarded

```rust
// Guard against double-init:
if e.storage().instance().has(&DataKey::Config) {
    return Err(ContractError::AlreadyInitialized);
}
```

## 13. Zero-duration orders / zero fill amounts

Always validate that amounts and durations are > 0 before accepting them:

```rust
if duration_secs == 0 || duration_secs > config.max_duration_secs {
    return Err(ContractError::InvalidDuration);
}
```

## 14. Testnet resets quarterly

Plan for re-deployment. Testnet state is wiped ~every quarter. Never store non-reproducible state only on testnet. Document your deploy scripts.

## 15. Error table

| Code | Meaning | Fix |
|------|---------|-----|
| `tx_bad_seq` | Stale sequence number | Reload account before building tx |
| `op_no_trust` | Missing trustline | Establish trustline first |
| `op_underfunded` | Insufficient XLM/token | Fund account; check minimums |
| `tx_insufficient_fee` | Fee too low | Use `simulateTransaction` to get resource estimate |
| `ExpiredEntry` | Ledger entry TTL expired | Restore footprint, then re-simulate |
