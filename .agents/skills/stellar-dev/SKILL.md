---
name: stellar-dev
description: Stellar blockchain development — Soroban smart contracts, JS/TS client SDK, wallet integration, assets, SEPs, testing and security.
---

# Stellar Development Skill

## Scope

**In scope:** Soroban contract development (Rust), dApp frontends (JS/TS), wallet flows, asset issuance, SEP standards, ZK proofs, testing strategies, security audits.

**Out of scope:** Non-Stellar blockchains, node operations, general Rust unrelated to Soroban.

## Core Stack

| Layer | Tool |
|-------|------|
| Smart contracts | Soroban + `soroban-sdk` (Rust) |
| Client SDK | `@stellar/stellar-sdk` (JS/TS) |
| APIs | Stellar RPC (preferred) · Horizon (legacy/historical) |
| Tokens | Stellar Assets first; custom Soroban tokens only when needed |
| Wallets | Freighter primary · multi-wallet via Stellar Wallets Kit |
| Build | `stellar contract build` (not `cargo build --target wasm32-unknown-unknown`) |

## Key principles

- Always specify network passphrase explicitly — mismatches silently break transactions
- Simulate transactions before submitting (Soroban requirement)
- Extend TTL proactively — archived ledger entries freeze user funds
- Use `require_auth()` on every state-changing entrypoint
- Prefer `persistent()` storage for critical state, `instance()` for contract globals, `temporary()` for cheap ephemeral data

## Module index

| File | Content |
|------|---------|
| [contracts-soroban.md](contracts-soroban.md) | Soroban architecture, storage types, deployment, constructors |
| [frontend-stellar-sdk.md](frontend-stellar-sdk.md) | Next.js/React integration, wallet flows, transaction building |
| [api-rpc-horizon.md](api-rpc-horizon.md) | RPC vs Horizon, historical data, indexers |
| [stellar-assets.md](stellar-assets.md) | Classic assets, SAC, trustlines, issuance |
| [standards-reference.md](standards-reference.md) | SEPs and CAPs quick reference |
| [testing.md](testing.md) | Unit, integration, fuzz, mutation testing |
| [security.md](security.md) | Vulnerability checklist, audit tools |
| [common-pitfalls.md](common-pitfalls.md) | 15 frequent mistakes and fixes |
| [advanced-patterns.md](advanced-patterns.md) | Upgradeability, factory, governance, DeFi primitives |
| [ecosystem.md](ecosystem.md) | DeFi protocols, wallets, oracles, indexers, tools |
| [zk-proofs.md](zk-proofs.md) | ZK verification patterns on Soroban |
| [resources.md](resources.md) | Official docs, SDKs, CLIs, examples, community |
