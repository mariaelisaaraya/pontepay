# Stellar Assets

## Two token mechanisms

| Type | Description | When to use |
|------|-------------|-------------|
| **Stellar Assets (Classic)** | Built-in, efficient, full ecosystem support | Standard fungible tokens, compliance needs, ecosystem integration |
| **Soroban Tokens** | Custom contracts, flexible logic | Complex auth, non-standard behaviors |
| **SAC (Stellar Asset Contract)** | Soroban interface for Classic assets | Bridging Classic ↔ smart contracts |

## Asset identifiers

```
Native XLM:   no issuer
Credit asset: CODE:ISSUER_ADDRESS
  - alphanum4:  1-4 chars (e.g. USDC)
  - alphanum12: 5-12 chars
```

USDC on Stellar:
- Testnet: `USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- Mainnet: `USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`

## Trustlines

Users must establish a trustline to hold any non-native asset:

```typescript
import { Asset, Operation, TransactionBuilder } from '@stellar/stellar-sdk';

// Check trustline:
const account = await horizon.loadAccount(address);
const hasTrust = account.balances.some(
  b => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
);

// Create trustline:
const changeTrust = Operation.changeTrust({
  asset: new Asset('USDC', USDC_ISSUER),
  limit: '1000',  // max holding limit
});
```

## Issuing an asset

```typescript
// 1. Create issuer + distributor accounts (separate for security)
// 2. Fund both on testnet via Friendbot
// 3. Distributor establishes trustline to issuer
// 4. Issuer sends asset to distributor
// 5. (Optional) Lock issuer: set masterWeight to 0 for fixed supply
```

## Asset flags (issuer configuration)

| Flag | Effect |
|------|--------|
| `AUTH_REQUIRED` | Users must get approval before receiving tokens |
| `AUTH_REVOCABLE` | Issuer can freeze accounts |
| `AUTH_IMMUTABLE` | Flags cannot be changed after setting |
| `AUTH_CLAWBACK_ENABLED` | Issuer can recover tokens |

## Stellar Asset Contract (SAC)

Allows smart contracts to interact with Classic assets using the standard token interface:

```rust
use soroban_sdk::token::Client as TokenClient;

let token = TokenClient::new(&e, &config.token);
// Standard ops: balance(), transfer(), approve(), allowance()
token.transfer(&from, &to, &amount);
let bal = token.balance(&address);
```

## Querying via Horizon

```typescript
// All assets with code USDC:
const assets = await horizon.assets().forCode('USDC').call();

// Specific asset stats:
const stats = await horizon.assets()
  .forCode('USDC')
  .forIssuer(USDC_ISSUER)
  .call();
// .records[0].amount = total supply
// .records[0].num_accounts = trustline count
```

## Best practices

- Keep issuer and distributor accounts separate
- Publish a `stellar.toml` with `[[CURRENCIES]]` metadata
- Validate issuer address, not just asset code (anyone can issue "USDC")
- Monitor trustline authorization status before transfers
