'use client';

import { ReactNode } from 'react';
import { CurrencyProvider } from '@/context/CurrencyContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CurrencyProvider>
      {children}
    </CurrencyProvider>
  );
}
