'use client';
// Central Privy × Stellar adapter.
// All pages import useStellarWallet() from here — single source of truth.

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMemo } from 'react';

export type PrivyStellarWallet = {
  address: string;
  // Signs a Soroban unsigned XDR and returns the signed XDR (base64).
  signEscrowXdr: (unsignedXdr: string) => Promise<string>;
};

// ── Fallback: localStorage keypair ───────────────────────────────────────────
// Privy v2.25 doesn't expose Stellar embedded wallets through useWallets().
// When no Stellar wallet is found, we generate a deterministic keypair keyed
// by the Privy user ID and store it in localStorage. Testnet/demo only.

async function getOrCreateLocalKeypair(userId: string): Promise<{ address: string; secret: string }> {
  const key = `pontepay_stellar_kp_${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as { address: string; secret: string };
    } catch { /* fall through to create */ }
  }
  const { Keypair } = await import('@stellar/stellar-sdk');
  const kp = Keypair.random();
  const entry = { address: kp.publicKey(), secret: kp.secret() };
  localStorage.setItem(key, JSON.stringify(entry));
  return entry;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useStellarWallet(): {
  wallet: PrivyStellarWallet | null;
  address: string | null;
  isReady: boolean;
} {
  const { wallets } = useWallets();
  const { user } = usePrivy();

  // 1. Try Privy native Stellar embedded wallet (future-proof)
  const raw = wallets.find(
    (w) =>
      w.walletClientType === 'privy' &&
      ((w as unknown as { chainType?: string }).chainType === 'stellar' ||
        (w as unknown as { chain?: string }).chain === 'stellar'),
  );

  const privyWallet: PrivyStellarWallet | null = useMemo(() => {
    if (!raw) return null;
    return {
      address: raw.address,
      async signEscrowXdr(unsignedXdr: string): Promise<string> {
        const privyRaw = raw as unknown as {
          signTransaction: (xdr: string, opts?: Record<string, string>) => Promise<string>;
        };
        if (typeof privyRaw.signTransaction !== 'function') {
          throw new Error('[PontePay] Privy Stellar wallet does not expose signTransaction.');
        }
        const networkPassphrase =
          process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE?.trim() ||
          'Test SDF Network ; September 2015';
        return privyRaw.signTransaction(unsignedXdr, { networkPassphrase });
      },
    };
  }, [raw]);

  // 2. Fallback: local keypair in localStorage (testnet demo)
  const localWallet: PrivyStellarWallet | null = useMemo(() => {
    if (raw || !user?.id) return null;
    const userId = user.id;
    return {
      address: '', // populated async — see useEffect pattern in WalletButton
      async signEscrowXdr(unsignedXdr: string): Promise<string> {
        const { address, secret } = await getOrCreateLocalKeypair(userId);
        const { Keypair, Transaction, Networks } = await import('@stellar/stellar-sdk');
        const kp = Keypair.fromSecret(secret);
        const networkPassphrase =
          process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE?.trim() ||
          'Test SDF Network ; September 2015';
        const tx = new Transaction(unsignedXdr, networkPassphrase as typeof Networks.TESTNET);
        tx.sign(kp);
        void address; // used in getOrCreateLocalKeypair
        return tx.toEnvelope().toXDR('base64');
      },
    };
  }, [raw, user?.id]);

  if (raw && privyWallet) {
    return { wallet: privyWallet, address: raw.address, isReady: true };
  }

  // Fallback wallet exists but address needs to be read async — return null until
  // WalletButton reads the address directly via getOrCreateLocalKeypair.
  if (localWallet && user?.id) {
    return { wallet: localWallet, address: null, isReady: false };
  }

  return { wallet: null, address: null, isReady: false };
}

// Exported for use in WalletButton to resolve the local address synchronously-ish
export { getOrCreateLocalKeypair };
