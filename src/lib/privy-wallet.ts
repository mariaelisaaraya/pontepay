'use client';
// Stellar wallet adapter — uses Freighter browser extension.
// All pages import useStellarWallet() from here; the PrivyStellarWallet
// type alias is kept for backwards compat with trade-actions / trustless/client.

import { useState, useEffect } from 'react';
import {
  isConnected,
  isAllowed,
  getAddress,
  signTransaction,
} from '@stellar/freighter-api';
import { Networks } from '@stellar/stellar-sdk';

const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE?.trim() || Networks.TESTNET;

// ─── Types ────────────────────────────────────────────────────────────────────

export type StellarWallet = {
  address: string;
  signEscrowXdr: (unsignedXdr: string) => Promise<string>;
};

// Backwards-compat alias used by trade-actions.ts and trustless/client.ts
export type PrivyStellarWallet = StellarWallet;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStellarWallet(): {
  wallet: StellarWallet | null;
  address: string | null;
  isReady: boolean;
} {
  const [address, setAddress] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkFreighter() {
      try {
        const { isConnected: connected } = await isConnected();
        if (!connected || cancelled) { setIsReady(true); return; }

        const { isAllowed: allowed } = await isAllowed();
        if (!allowed || cancelled) { setIsReady(true); return; }

        const { address: addr, error } = await getAddress();
        if (!cancelled) {
          setAddress(error ? null : (addr ?? null));
          setIsReady(true);
        }
      } catch {
        if (!cancelled) setIsReady(true);
      }
    }

    void checkFreighter();
    return () => { cancelled = true; };
  }, []);

  const wallet: StellarWallet | null = address
    ? {
        address,
        async signEscrowXdr(unsignedXdr: string): Promise<string> {
          const { signedTxXdr, error } = await signTransaction(unsignedXdr, {
            networkPassphrase: NETWORK_PASSPHRASE,
          });
          if (error) throw new Error(`Freighter signing failed: ${error}`);
          return signedTxXdr ?? unsignedXdr;
        },
      }
    : null;

  return { wallet, address, isReady };
}
