'use client';
// Central Privy × Stellar adapter.
// All pages import useStellarWallet() from here — single source of truth.

import { useWallets } from '@privy-io/react-auth';

export type PrivyStellarWallet = {
  address: string;
  // Signs a Soroban unsigned XDR and returns the signed XDR (base64).
  signEscrowXdr: (unsignedXdr: string) => Promise<string>;
};

export function useStellarWallet(): {
  wallet: PrivyStellarWallet | null;
  address: string | null;
  isReady: boolean;
} {
  const { wallets } = useWallets();

  // Privy v2 follows `w.chainType === 'stellar'` for Stellar embedded wallets.
  const raw = wallets.find(
    (w) =>
      w.walletClientType === 'privy' &&
      ((w as unknown as { chainType?: string }).chainType === 'stellar' ||
        (w as unknown as { chain?: string }).chain === 'stellar'),
  );

  if (!raw) {
    return { wallet: null, address: null, isReady: false };
  }

  const wallet: PrivyStellarWallet = {
    address: raw.address,

    async signEscrowXdr(unsignedXdr: string): Promise<string> {
      // Privy v2 embedded Stellar wallet — signTransaction takes the raw XDR string
      // and returns the signed XDR string.
      // See: https://docs.privy.io/wallets/embedded/stellar/sign-transactions
      const privyWallet = raw as unknown as {
        signTransaction: (xdr: string, opts?: Record<string, string>) => Promise<string>;
      };
      if (typeof privyWallet.signTransaction !== 'function') {
        throw new Error(
          '[PeerlyPay] Privy Stellar wallet does not expose signTransaction. ' +
          'Ensure the user is authenticated and the Stellar embedded wallet is active.',
        );
      }
      const networkPassphrase =
        process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE?.trim() ||
        'Test SDF Network ; September 2015';
      return privyWallet.signTransaction(unsignedXdr, { networkPassphrase });
    },
  };

  return { wallet, address: raw.address, isReady: true };
}
