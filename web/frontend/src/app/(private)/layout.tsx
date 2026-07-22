'use client';

import type { Metadata } from 'next';
import Navigation from '@/components/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace('/login');
    }
  }, [ready, isAuthenticated, router]);

  // Show spinner while checking auth state (SSR hydration)
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  // Don't render children until auth is confirmed
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <main>
      <div className="relative w-full">
        <Navigation />
        <div>
          {children}
        </div>
      </div>
    </main>
  );
}
