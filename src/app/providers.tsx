"use client";

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { UserProvider } from "@/contexts/UserContext";
import { TradeHistoryProvider } from "@/contexts/TradeHistoryContext";
import { useStore } from '@/lib/store';

// PrivyProvider only runs client-side (ssr: false) to avoid build failures
// when NEXT_PUBLIC_PRIVY_APP_ID is not set or invalid during prerendering.
// Set the env var in Vercel dashboard + dashboard.privy.io (enable Stellar embedded wallets).
const PrivyClientProvider = dynamic(() => import('./privy-provider'), { ssr: false });

function ChainOrdersBootstrap() {
  const refreshOrdersFromChain = useStore((state) => state.refreshOrdersFromChain);

  useEffect(() => {
    void refreshOrdersFromChain();
  }, [refreshOrdersFromChain]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyClientProvider>
      <UserProvider>
        <TradeHistoryProvider>
          <ChainOrdersBootstrap />
          {children}
        </TradeHistoryProvider>
      </UserProvider>
    </PrivyClientProvider>
  );
}
