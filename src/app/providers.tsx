"use client";

import { useEffect } from 'react';
import { UserProvider } from "@/contexts/UserContext";
import { TradeHistoryProvider } from "@/contexts/TradeHistoryContext";
import { useStore } from '@/lib/store';

function ChainOrdersBootstrap() {
  const refreshOrdersFromChain = useStore((state) => state.refreshOrdersFromChain);

  useEffect(() => {
    void refreshOrdersFromChain();
  }, [refreshOrdersFromChain]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <TradeHistoryProvider>
        <ChainOrdersBootstrap />
        {children}
      </TradeHistoryProvider>
    </UserProvider>
  );
}
