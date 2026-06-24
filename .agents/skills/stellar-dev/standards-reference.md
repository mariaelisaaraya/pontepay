# SEP & CAP Quick Reference

> Standards evolve. Always verify status at:
> - SEPs: github.com/stellar/stellar-protocol/tree/master/ecosystem
> - CAPs: github.com/stellar/stellar-protocol/tree/master/core

## SEPs for application developers

### Authentication & Identity
| SEP | Name | Status | Use |
|-----|------|--------|-----|
| SEP-0001 | stellar.toml | Active | Publish org/asset metadata |
| SEP-0010 | Web Authentication | Active | Wallet-signed auth challenge |
| SEP-0012 | KYC Exchange | Active | Anchor KYC data exchange |
| SEP-0023 | Key Encoding | Active | Strkey encoding for addresses |
| SEP-0030 | Account Recovery | Active | Social recovery for accounts |
| SEP-0045 | Web Auth for Contracts | Draft | SEP-10 for smart wallets |

### Anchors & Fiat Integration
| SEP | Name | Status | Use |
|-----|------|--------|-----|
| SEP-0006 | Programmatic Deposit/Withdrawal | Active | Automated anchor flows |
| SEP-0024 | Interactive Deposit/Withdrawal | Active | Hosted anchor UI flow |
| SEP-0031 | Cross-Border Payments | Active | Business-to-business corridors |
| SEP-0038 | Anchor RFQ | Active | Quote before swap |

### Tokens & Contracts
| SEP | Name | Status | Use |
|-----|------|--------|-----|
| SEP-0041 | Soroban Token Interface | Active | Standard fungible token ABI |
| SEP-0046 | WASM Metadata | Active | Contract metadata on-chain |
| SEP-0048 | Contract Interface Spec | Active | Contract ABI specification |
| SEP-0049 | Contract Upgradeability | Active | Safe upgrade patterns |
| SEP-0050 | Non-Fungible Tokens | Draft | NFT standard |
| SEP-0055 | Contract Verification | Draft | Source code verification |
| SEP-0056 | Tokenized Vault Standard | Draft | ERC-4626 equivalent |
| SEP-0057 | Regulated Tokens | Draft | Compliance-enabled tokens |

## Essential CAPs for Soroban

| CAP | Topic |
|-----|-------|
| CAP-0046 series | Runtime, lifecycle, functions, storage, authorization |
| CAP-0051 | Passkey cryptography (Ed25519 signatures via passkeys) |
| CAP-0053 | TTL / archival behavior |
| CAP-0058 | Constructors (`__constructor`) |
| CAP-0059 | BLS12-381 host functions |
| CAP-0067 | Protocol improvements |
| CAP-0074 | BN254 curves (Draft) |
| CAP-0075 | Poseidon hashing (Draft) |
| CAP-0079 | Address conversion |

## Implementation workflow

1. Categorize your feature (token, auth, anchor, upgrades)
2. Find the relevant SEP/CAP above
3. Check current status in the official repos
4. Verify the feature is supported on your target network
5. Document any draft-standard dependencies in your README
