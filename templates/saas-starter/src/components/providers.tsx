'use client';

import { ReactNode } from 'react';
import { PrivyStack } from '@varity-labs/ui-kit';
import { ToastProvider } from '@/components/ui/toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyStack
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      thirdwebClientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
      loginMethods={['email', 'google']}
      appearance={{
        theme: 'light',
        accentColor: '#2563EB',
        logo: '/logo.svg',
      }}
    >
      <ToastProvider>
        {children}
      </ToastProvider>
    </PrivyStack>
  );
}
