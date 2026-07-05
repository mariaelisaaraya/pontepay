'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export interface CompletedTrade {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  arsReceived: number;
  rate: number;
  date: string;
  marketMaker: string;
  status: 'completed';
  paymentMethod: string;
  txnId: string;
}

interface TradeHistoryContextType {
  trades: CompletedTrade[];
  addTrade: (trade: Omit<CompletedTrade, 'id' | 'date' | 'status'>) => CompletedTrade;
  loading: boolean;
}

const TradeHistoryContext = createContext<TradeHistoryContextType | undefined>(undefined);

// Legacy device-global key (pre user-scoping). Migrated to the per-user key on
// first login so history is never shown to a logged-out visitor or another account.
const LEGACY_TRADES_STORAGE_KEY = 'pontepay_trades';

function storageKeyFor(userId: string): string {
  return `pontepay_trades_${userId}`;
}

export function TradeHistoryProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const [trades, setTrades] = useState<CompletedTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = authenticated ? user?.id ?? null : null;

  useEffect(() => {
    if (!ready) return;

    if (!userId) {
      setTrades([]);
      setLoading(false);
      return;
    }

    const key = storageKeyFor(userId);
    try {
      // One-time migration of the old global history into this user's bucket.
      const legacy = localStorage.getItem(LEGACY_TRADES_STORAGE_KEY);
      if (legacy) {
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, legacy);
        }
        localStorage.removeItem(LEGACY_TRADES_STORAGE_KEY);
      }

      const stored = localStorage.getItem(key);
      setTrades(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error('Error loading trade history:', error);
      localStorage.removeItem(key);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [ready, userId]);

  const persist = useCallback((updated: CompletedTrade[]) => {
    if (!userId) return;
    try {
      localStorage.setItem(storageKeyFor(userId), JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving trade history:', error);
    }
  }, [userId]);

  const addTrade = useCallback((input: Omit<CompletedTrade, 'id' | 'date' | 'status'>): CompletedTrade => {
    const trade: CompletedTrade = {
      ...input,
      id: `TRD-${Date.now()}`,
      date: new Date().toISOString(),
      status: 'completed',
    };
    setTrades((prev) => {
      const updated = [trade, ...prev];
      persist(updated);
      return updated;
    });
    return trade;
  }, [persist]);

  return (
    <TradeHistoryContext.Provider value={{ trades, addTrade, loading }}>
      {children}
    </TradeHistoryContext.Provider>
  );
}

export function useTradeHistory() {
  const context = useContext(TradeHistoryContext);
  if (!context) {
    throw new Error('useTradeHistory must be used within TradeHistoryProvider');
  }
  return context;
}
