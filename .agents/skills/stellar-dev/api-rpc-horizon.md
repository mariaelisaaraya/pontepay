# Stellar API: RPC vs Horizon

## Which to use

| Need | Use |
|------|-----|
| Soroban contract interaction | **RPC** |
| Real-time state queries | **RPC** |
| Historical data (>7 days) | **Horizon** or indexer |
| Account metadata, offers, trades | **Horizon** |
| Streaming events | Poll RPC (no WebSocket) |

## RPC endpoints

| Network | URL |
|---------|-----|
| Testnet | `https://soroban-testnet.stellar.org` |
| Mainnet | Choose a provider (see below) |

## Key RPC methods

```typescript
import { rpc } from '@stellar/stellar-sdk';
const server = new rpc.Server(RPC_URL);

// Account (with sequence number for tx building):
const account = await server.getAccount(publicKey);

// Read contract storage directly:
const entry = await server.getLedgerEntries(ledgerKey);

// Simulate before submit:
const sim = await server.simulateTransaction(tx);

// Submit:
const result = await server.sendTransaction(signedTx);

// Poll status:
const status = await server.getTransaction(txHash);
```

## Important RPC limitation

**7-day history** — `getTransaction` and `getEvents` only access recent data.  
`getLedgers` can query back to genesis via the Infinite Scroll feature (powered by the public Data Lake on AWS).

## Horizon (legacy / historical)

```typescript
import { Horizon } from '@stellar/stellar-sdk';
const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');

// Account balances:
const account = await horizon.loadAccount(publicKey);

// Recent payments:
const payments = await horizon.payments().forAccount(publicKey).call();

// Assets:
const assets = await horizon.assets().forCode('USDC').call();
```

## Historical data beyond 7 days

| Tool | Type | URL |
|------|------|-----|
| **Hubble** | BigQuery dataset (30 min lag) | [developers.stellar.org/docs/data/analytics/hubble](https://developers.stellar.org/docs/data/analytics/hubble) |
| **Mercury** | Stellar-native indexer + GraphQL | [mercurydata.app](https://mercurydata.app) |
| **SubQuery** | Multi-chain indexer | [subquery.network](https://subquery.network) |
| **Goldsky** | Real-time pipelines + subgraphs | [goldsky.com](https://goldsky.com) |
| **StellarExpert API** | Free REST, no auth, CORS-enabled | [stellar.expert/openapi.html](https://stellar.expert/openapi.html) |
| **Galexie** | Self-hosted data pipeline | [developers.stellar.org](https://developers.stellar.org/docs/data/indexers/build-your-own/galexie) |

## RPC providers (mainnet)

| Provider | Notes |
|----------|-------|
| [Quasar / Lightsail](https://quasar.lightsail.network) | Stellar-native, Archive RPC, hosted Galexie |
| [Blockdaemon](https://blockdaemon.com/soroban) | Enterprise |
| [Validation Cloud](https://validationcloud.io) | Testnet + Mainnet |
| [QuickNode](https://quicknode.com) | Dedicated options |
| [Ankr](https://ankr.com) | Testnet + Mainnet |

## Block explorers

| Explorer | URL |
|----------|-----|
| StellarExpert | [stellar.expert](https://stellar.expert) |
| StellarChain | [stellarchain.io](https://stellarchain.io) |
| Stellar Lab (dev tools) | [lab.stellar.org](https://lab.stellar.org) |
