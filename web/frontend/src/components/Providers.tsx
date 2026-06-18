'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import type { ReactNode } from 'react';
import { FullscreenProvider } from '@/hooks/useFullscreen';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <FullscreenProvider>
        {children}
      </FullscreenProvider>
    </QueryClientProvider>
  );
}
