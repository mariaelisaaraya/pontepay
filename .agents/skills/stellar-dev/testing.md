# Soroban Testing

## Testing pyramid

```
Unit tests          ← fastest, no WASM compile, run with cargo test
Integration tests   ← local Quickstart Docker or testnet
Testnet validation  ← real network, quarterly resets
Mainnet smoke tests ← production sanity
```

## Unit testing (SDK test utilities)

```rust
#![cfg(test)]

use soroban_sdk::{testutils::{Address as _, Ledger}, Env};

#[test]
fn test_confirm_releases_funds() {
    let env = Env::default();
    env.mock_all_auths(); // skip signature verification in tests

    // Manipulate ledger time:
    env.ledger().with_mut(|l| { l.timestamp = 1000; });

    let admin = Address::generate(&env);
    let client = MyContractClient::new(&env, &env.register(MyContract {}, ()));

    client.initialize(&admin, ...);
    // ... test logic
}
```

Key test utilities:
- `env.mock_all_auths()` — bypass all auth checks
- `env.ledger().with_mut(...)` — set block timestamp
- `Address::generate(&env)` — create test addresses
- `token::StellarAssetClient` — mint test tokens
- `client.try_method(...)` — returns `Result` for negative tests

## Local integration testing (Quickstart Docker)

```bash
docker run --rm -it --name stellar \
  -p 8000:8000 \
  stellar/quickstart:latest \
  --local

# Fund a test account:
curl "http://localhost:8000/friendbot?addr=<ADDRESS>"

# Deploy:
stellar contract deploy --network local --source admin --wasm contract.wasm
```

## Advanced testing techniques

### Fuzz testing
```toml
# Cargo.toml
[dev-dependencies]
soroban-sdk = { version = "23.1.1", features = ["arbitrary"] }
```
```bash
cargo install cargo-fuzz
cargo fuzz run fuzz_target
```

### Property-based testing
```toml
[dev-dependencies]
proptest = "1"
```
```rust
proptest! {
    #[test]
    fn fee_never_exceeds_amount(amount in 0i128..1_000_000_000i128) {
        let fee = amount * 50 / 10_000;
        prop_assert!(fee <= amount);
    }
}
```

### Differential testing (snapshots)
```bash
# Generates JSON snapshots of contract outputs for regression detection
cargo test -- --test-output immediate 2>&1 | tee snapshots/test-output.json
```

### Fork testing
Test against real production state:
```bash
stellar contract invoke --network mainnet --id <PROD_CONTRACT> -- get_order --order_id 0
```

### Mutation testing
```bash
cargo install cargo-mutants
cargo mutants -p p2p   # detects tests that don't actually verify behavior
```

## CI example (GitHub Actions)

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions-rs/toolchain@v1
      with: { toolchain: stable, target: wasm32-unknown-unknown }
    - run: cargo test -p p2p
    - run: stellar contract build
```

## Test checklist

- [ ] Happy path for every entrypoint
- [ ] All `ContractError` variants triggered
- [ ] Unauthorized callers rejected
- [ ] Pause/unpause behavior (blocked + allowed paths)
- [ ] Partial fills and multi-fill sequences
- [ ] Timeout scenarios (before and after deadline)
- [ ] Dispute and resolution (confirmed + rejected)
- [ ] Oracle not set → graceful error
- [ ] Zero-amount and zero-duration inputs rejected
- [ ] Balance changes verified after every transfer
- [ ] TTL extension doesn't break reads

## Testnet note

**Testnet resets approximately quarterly.** Always document deploy scripts and seed data procedures so you can redeploy quickly after a reset.
