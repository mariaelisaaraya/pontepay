'use client';
// Stellar wallet adapter — uses Crossmint email/social embedded wallet.
// All pages import useStellarWallet() from here; the PrivyStellarWallet
// type alias is kept for backwards compat with trade-actions / trustless/client.

import { useWallet } from '@crossmint/client-sdk-react-ui';

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
  const { wallet, status } = useWallet();

  const isReady = status === 'loaded' || status === 'error';
  const address = wallet?.address ?? null;

  const stellarWallet: StellarWallet | null = address && wallet
    ? {
        address,
        async signEscrowXdr(unsignedXdr: string): Promise<string> {
          // Crossmint handles signing via its embedded key — returns signed XDR.
          const signed = await (wallet as unknown as { signTransaction: (xdr: string) => Promise<string> }).signTransaction(unsignedXdr);
          return signed;
        },
      }
    : null;

  return { wallet: stellarWallet, address, isReady };
}
