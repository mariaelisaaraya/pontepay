# Advanced Soroban Patterns

## Upgradeability

Decide on mutability before deploying — upgrades are harder to add later.

```rust
// Version tracking in storage:
#[contracttype]
enum DataKey { Version, Config, ... }

// Monotonic version progression:
pub fn migrate(e: Env, caller: Address, new_version: u32) -> Result<(), Error> {
    caller.require_auth();
    ensure_admin(&e, &caller)?;

    let current: u32 = e.storage().instance().get(&DataKey::Version).unwrap_or(0);
    if new_version <= current { return Err(Error::InvalidVersion); }

    e.storage().instance().set(&DataKey::Version, &new_version);
    // run migration logic for this version...
    Ok(())
}
```

## Factory pattern

```rust
pub fn create_child(e: Env, caller: Address, salt: BytesN<32>) -> Address {
    caller.require_auth();

    let deployer = e.deployer();
    let wasm_hash = get_child_wasm_hash(&e);

    // Deterministic address from salt:
    let (child_address, _) = deployer.with_current_contract(salt).deploy_v2(wasm_hash, ());

    // Register in registry:
    let mut registry = get_registry(&e);
    registry.push_back(child_address.clone());
    set_registry(&e, &registry);

    e.events().publish(("ChildCreated",), child_address.clone());
    child_address
}
```

## Governance / timelock

```rust
// Propose → wait → execute flow prevents front-running sensitive changes:
pub fn propose_change(e: Env, proposer: Address, change: Change) -> u64 {
    proposer.require_auth();
    ensure_proposer(&e, &proposer)?;

    let execution_time = e.ledger().timestamp() + TIMELOCK_SECS;
    let proposal_id = next_proposal_id(&e);
    store_proposal(&e, proposal_id, &Proposal { change, execution_time, executed: false });
    proposal_id
}

pub fn execute_change(e: Env, executor: Address, proposal_id: u64) -> Result<(), Error> {
    executor.require_auth();
    let proposal = get_proposal(&e, proposal_id)?;
    if e.ledger().timestamp() < proposal.execution_time {
        return Err(Error::TimelockNotExpired);
    }
    if proposal.executed { return Err(Error::AlreadyExecuted); }
    // apply change...
}
```

## DeFi: fee calculation (safe)

```rust
// Always: multiply first, then divide (avoids rounding to zero for small amounts)
// Always: use checked operations
pub fn calculate_fee(amount: i128, fee_bps: u32) -> Result<i128, ContractError> {
    amount
        .checked_mul(fee_bps as i128)
        .ok_or(ContractError::Overflow)?
        .checked_div(10_000)
        .ok_or(ContractError::DivisionError)
}
```

## DeFi: oracle freshness

```rust
const MAX_ORACLE_AGE_SECS: u64 = 300; // 5 minutes

pub fn get_fresh_price(e: &Env) -> Result<i128, ContractError> {
    let oracle = OracleManager::get_oracle(e)?;
    let price_data = oracle.lastprice(&asset).ok_or(ContractError::OracleUnavailable)?;

    let now = e.ledger().timestamp();
    if now.saturating_sub(price_data.timestamp) > MAX_ORACLE_AGE_SECS {
        return Err(ContractError::OracleStale);
    }
    if price_data.price <= 0 {
        return Err(ContractError::OracleUnavailable);
    }
    Ok(price_data.price)
}
```

## Storage optimization

```rust
// Prefer instance() for globals (one TTL to manage):
e.storage().instance().set(&DataKey::Config, &config);
e.storage().instance().extend_ttl(86_400, 518_400);

// Use persistent() for per-entity state:
e.storage().persistent().set(&DataKey::Order(id), &order);
e.storage().persistent().extend_ttl(&DataKey::Order(id), 86_400, 518_400);

// Use temporary() only for data you're OK losing:
e.storage().temporary().set(&DataKey::Nonce(user), &nonce);
// No extend_ttl needed — it will auto-delete
```

## Compliance (regulated tokens)

```rust
// Allowlist check before any transfer:
fn ensure_allowed(e: &Env, address: &Address) -> Result<(), Error> {
    if !is_on_allowlist(e, address) {
        return Err(Error::NotAllowed);
    }
    Ok(())
}

// Never store sensitive PII on-chain — store hashes or off-chain references only
```

## Testing advanced patterns

For each advanced feature, test:
- [ ] Authorization: only authorized roles can call privileged functions
- [ ] Idempotency: re-running migration with same version fails
- [ ] Timelock: execution before delay fails; after delay succeeds
- [ ] Oracle stale price: rejected with appropriate error
- [ ] Fee rounding: fee never exceeds fill amount
