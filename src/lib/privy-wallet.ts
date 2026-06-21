'use client';
// Central Privy × Stellar adapter.
// All pages import useStellarWallet() from here — single source of truth.
//
// ELI — two TODOs below:
//   1. Confirm the exact Privy wallet field that identifies a Stellar embedded wallet.
//   2. Implement signEscrowXdr() with Privy's Stellar raw_sign / signTransaction.

import { useWallets } from '@privy-io/react-auth';
import { TransactionBuilder, Networks } from '@stellar/stellar-sdk';

export type PrivyStellarWallet = {
  address: string;
  // Signs a Trustless Work unsigned XDR and returns the signed XDR (base64).
  signEscrowXdr: (unsignedXdr: string) => Promise<string>;
};

export function useStellarWallet(): {
  wallet: PrivyStellarWallet | null;
  address: string | null;
  isReady: boolean;
} {
  const { wallets } = useWallets();

  // ELI TODO-1: confirm the Privy ConnectedWallet field for Stellar.
  // Privy follows the pattern `w.chain === 'stellar'` for non-EVM chains.
  // If `useStellarWallets()` is exported by @privy-io/react-auth, prefer that.
  const raw = wallets.find(
    (w) => w.walletClientType === 'privy' && (w as unknown as { chain?: string }).chain === 'stellar',
  );

  if (!raw) {
    return { wallet: null, address: null, isReady: false };
  }

  const wallet: PrivyStellarWallet = {
    address: raw.address,

    async signEscrowXdr(unsignedXdr: string): Promise<string> {
      // ELI TODO-2: Privy Stellar raw XDR signing.
      //
      // Suggested approach (verify against Privy docs for the installed version):
      //
      //   import { Transaction } from '@stellar/stellar-sdk';
      //   const tx = TransactionBuilder.fromXDR(unsignedXdr, Networks.TESTNET);
      //   // Option A — if Privy exposes signTransaction(xdrString):
      //   const signedXdr = await (raw as any).signTransaction(unsignedXdr);
      //   return signedXdr;
      //
      //   // Option B — if Privy exposes raw Ed25519 sign(buffer):
      //   const hash = tx.hash();
      //   const { signature } = await (raw as any).sign({ message: hash });
      //   // Re-attach signature to tx envelope and return base64 XDR.
      //
      // Privy Stellar docs: https://docs.privy.io → Wallets → Stellar.
      void TransactionBuilder; void Networks; // keep import alive until TODO is resolved
      console.warn('[PeerlyPay] signEscrowXdr: not yet implemented.');
      return unsignedXdr;
    },
  };

  return { wallet, address: raw.address, isReady: true };
}
