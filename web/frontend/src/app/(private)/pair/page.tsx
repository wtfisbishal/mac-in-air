'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

// Pair page is no longer needed — devices are automatically paired via Google OAuth.
// Redirect any users who land here to the home dashboard.
export default function PairPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader size={24} className="animate-spin text-indigo-400" />
    </div>
  );
}
