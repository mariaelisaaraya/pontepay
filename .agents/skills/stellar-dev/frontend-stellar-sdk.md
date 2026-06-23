# Frontend with Stellar SDK (Next.js / React)

## Setup

```bash
npm install @stellar/stellar-sdk @creit.tech/stellar-wallets-kit @stellar/freighter-api
```

Requires Node.js 20+.

## Network config

```typescript
// lib/stellar-config.ts
import { Networks, rpc } from '@stellar/stellar-sdk';

export const NETWORK = {
  passphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? Networks.TESTNET,
  rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
};

export const server = new rpc.Server(NETWORK.rpcUrl, { allowHttp: true });
```

## Wallet integration — Stellar Wallets Kit (recommended)

Supports Freighter, LOBSTR, xBull, Albedo and more from a single interface:

```typescript
import { StellarWalletsKit, WalletNetwork, FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit';

const kit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
});

// Connect:
await kit.openModal({ onWalletSelected: async (option) => {
  kit.setWallet(option.id);
  const { address } = await kit.getAddress();
}});

// Sign a Soroban transaction XDR:
const { signedTxXdr } = await kit.signTransaction(unsignedXdr, {
  networkPassphrase: NETWORK.passphrase,
});
```

## Freighter only (simpler, single wallet):

```typescript
import { getAddress, signTransaction, isConnected } from '@stellar/freighter-api';

const connected = await isConnected();
const { address } = await getAddress();
const { signedTxXdr } = await signTransaction(unsignedXdr, {
  networkPassphrase: NETWORK.passphrase,
});
```

## Building and submitting a Soroban transaction

```typescript
import { TransactionBuilder, rpc } from '@stellar/stellar-sdk';

async function sorobanSubmit(unsignedXdr: string, sign: (xdr: string) => Promise<string>) {
  const server = new rpc.Server(NETWORK.rpcUrl);
  const tx = TransactionBuilder.fromXDR(unsignedXdr, NETWORK.passphrase);

  // 1. Simulate
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);

  // 2. Assemble auth + footprint
  const readyTx = rpc.assembleTransaction(tx, sim).build();

  // 3. Sign
  const signedXdr = await sign(readyTx.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK.passphrase);

  // 4. Submit + poll
  const result = await server.sendTransaction(signedTx);
  if (result.status === 'ERROR') throw new Error(JSON.stringify(result));

  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const status = await server.getTransaction(result.hash);
    if (status.status === rpc.Api.GetTransactionStatus.SUCCESS) return result.hash;
    if (status.status === rpc.Api.GetTransactionStatus.FAILED) throw new Error('tx failed');
  }
  throw new Error('tx not confirmed after 30s');
}
```

## Reading contract state

```typescript
import { Client } from '@/contracts/p2p/src'; // generated bindings

const client = new Client({
  contractId: process.env.NEXT_PUBLIC_P2P_CONTRACT_ID!,
  rpcUrl: NETWORK.rpcUrl,
  networkPassphrase: NETWORK.passphrase,
});

// Read-only (no signing needed):
const tx = await client.get_order({ order_id: BigInt(orderId) });
const order = tx.result; // or unwrap if Result<T>
```

## Write operations (requires publicKey for sequence number)

```typescript
const writeClient = new Client({
  contractId: process.env.NEXT_PUBLIC_P2P_CONTRACT_ID!,
  rpcUrl: NETWORK.rpcUrl,
  networkPassphrase: NETWORK.passphrase,
  publicKey: callerAddress, // required for write ops
});

const tx = await writeClient.take_order_with_amount({
  caller: callerAddress,
  order_id: BigInt(orderId),
  fill_amount: BigInt(fillAmount),
});
// tx is an AssembledTransaction — call sorobanSubmit(tx, signFn) to execute
```

## Account balance (Horizon)

```typescript
import { Horizon } from '@stellar/stellar-sdk';

const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
const account = await horizon.loadAccount(address);
const usdc = account.balances.find(
  b => b.asset_type !== 'native' && b.asset_code === 'USDC'
);
const balance = usdc ? parseFloat(usdc.balance) : 0;
```

## Advanced: Smart Account Kit (passkey auth, gasless)

```typescript
// Smart Account Kit by kalepail — production-grade passkey wallets
// https://github.com/kalepail/smart-account-kit
// Enables: biometric sign-in, fee sponsorship via OpenZeppelin Relayer
```

## UX checklist

- [ ] Loading states on every wallet operation
- [ ] Error messages mapped to human-readable text (not raw error codes)
- [ ] Prevent double-submission (disable button while pending)
- [ ] Show transaction hash + explorer link on success
- [ ] Handle wallet not installed (prompt install link)
- [ ] Handle network mismatch (wallet on mainnet, app on testnet)
