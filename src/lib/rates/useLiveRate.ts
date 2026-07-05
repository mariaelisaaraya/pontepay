'use client';

import { useEffect, useState } from 'react';

import { fallbackSnapshot, fetchRateSnapshot, type RateSnapshot } from '@/lib/rates/rates';

/**
 * Live USD/ARS rate hook. Starts from the constant fallback and updates once the
 * Reflector/BCRA snapshot resolves. Use `snapshot.usdArs` wherever MOCK_RATE was
 * previously used.
 */
export function useLiveRate(): RateSnapshot {
  const [snapshot, setSnapshot] = useState<RateSnapshot>(() => fallbackSnapshot());

  useEffect(() => {
    let active = true;
    fetchRateSnapshot()
      .then((next) => {
        if (active) setSnapshot(next);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      active = false;
    };
  }, []);

  return snapshot;
}
