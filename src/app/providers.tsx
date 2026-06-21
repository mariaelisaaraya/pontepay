"use client";

import { useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { UserProvider } from "@/contexts/UserContext";
import { TradeHistoryProvider } from "@/contexts/TradeHistoryContext";
import { useStore } from '@/lib/store';

// ELI: set NEXT_PUBLIC_PRIVY_APP_ID in .env and Vercel. Get it at dashboard.privy.io.
// Also enable Stellar embedded wallets in the Privy dashboard:
//   Settings → Embedded Wallets → Stellar → ON
//   Add allowed domains: localhost:3000 and peerlypay-two.vercel.app.
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';

function ChainOrdersBootstrap() {
  const refreshOrdersFromChain = useStore((state) => state.refreshOrdersFromChain);

  useEffect(() => {
    void refreshOrdersFromChain();
  }, [refreshOrdersFromChain]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google'],
        embeddedWallets: {
          // ELI: verify the exact Privy config key for Stellar embedded wallets.
          // Privy docs: https://docs.privy.io → Wallets → Stellar.
          // If the type error appears, check @privy-io/react-auth version for Stellar support.
          stellar: { createOnLogin: 'users-without-wallets' },
        } as Record<string, unknown>,
      }}
    >
      <UserProvider>
        <TradeHistoryProvider>
          <ChainOrdersBootstrap />
          {children}
        </TradeHistoryProvider>
      </UserProvider>
    </PrivyProvider>
  );
}
