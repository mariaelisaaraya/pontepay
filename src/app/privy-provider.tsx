"use client";

import { PrivyProvider } from '@privy-io/react-auth';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';

export default function PrivyClientProvider({ children }: { children: React.ReactNode }) {
  if (!PRIVY_APP_ID) return <>{children}</>;

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google'],
        embeddedWallets: {
          stellar: { createOnLogin: 'users-without-wallets' },
        } as Record<string, unknown>,
      }}
    >
      {children}
    </PrivyProvider>
  );
}
