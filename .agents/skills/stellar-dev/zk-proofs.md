# Zero-Knowledge Proofs on Soroban

> **Status-sensitive.** Always verify CAP status and network support before treating any ZK primitive as production-available.

## Before implementing — verify

1. CAP status in the [Stellar protocol repo](https://github.com/stellar/stellar-protocol/tree/master/core)
2. Software + protocol version of the target network
3. `soroban-sdk` support for the required host functions
4. Whether production examples exist

## Available primitives

| Primitive | CAP | SDK Module | Status |
|-----------|-----|-----------|--------|
| BLS12-381 | CAP-0059 | `soroban_sdk::crypto` | Active on testnet/mainnet |
| BN254 | CAP-0074 | `soroban_sdk::crypto::bn254` | Draft — verify before use |
| Poseidon / Poseidon2 | CAP-0075 | — | Draft — verify before use |

## Architecture patterns

### Pattern 1: Verification gate contract

A dedicated contract that normalizes inputs, validates proof format, runs cryptographic verification, and emits explicit events:

```rust
pub fn verify_proof(
    e: Env,
    caller: Address,
    proof: Bytes,
    public_inputs: Vec<i128>,
) -> Result<bool, ContractError> {
    caller.require_auth();

    // Normalize and validate inputs first:
    validate_proof_format(&proof)?;
    validate_public_inputs(&public_inputs)?;

    // Cryptographic verification:
    let valid = run_verification(&e, &proof, &public_inputs)?;

    e.events().publish(("ProofVerified",), (caller, valid));
    Ok(valid)
}
```

### Pattern 2: Policy / proof separation

Split responsibilities across contracts:
- **Verifier contract** — pure cryptographic verification, stateless
- **Policy contract** — business rules, state transitions
- **State contract** — persistent state management

This keeps each contract small (under 64KB) and auditable independently.

### Pattern 3: Feature flags

Only activate ZK flows where primitives are confirmed available:

```rust
pub fn claim_with_proof(e: Env, caller: Address, proof: Bytes) -> Result<(), ContractError> {
    // Check at runtime that the required host function exists:
    if !zk_primitives_available(&e) {
        return Err(ContractError::ZkNotSupported);
    }
    // ... proceed with ZK path
}
```

## Common mistakes

- Confusing successful proof parsing with proof validity
- Missing anti-replay protection (same proof submitted twice)
- Combining verifier + policy + state in one contract (makes each component harder to audit)
- Assuming BN254/Poseidon are available on mainnet (check CAP status first)

## Testing strategy

- **Unit:** validate domain separation, anti-replay checks
- **Integration:** full prove → verify round-trip on testnet
- **Negative:** invalid proofs rejected, replayed proofs rejected, wrong inputs rejected

## Tooling

| Tool | Purpose |
|------|---------|
| [Noir](https://noir-lang.org/docs/) | ZK domain-specific language (Aztec) |
| [RISC Zero](https://dev.risczero.com/) | General-purpose zkVM for Rust programs |
| [Certora Sunbeam](https://docs.certora.com/en/latest/docs/sunbeam/index.html) | Formal verification at WASM level |
| [Soroban Examples — groth16_verifier](https://github.com/stellar/soroban-examples) | Reference implementation |
