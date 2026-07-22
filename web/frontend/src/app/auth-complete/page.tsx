'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';
import type { AuthUser } from '@/types';

function AuthCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (!token || !userStr) {
      setStatus('error');
      setErrorMsg('Missing authentication data. Please try again.');
      return;
    }

    try {
      const user = JSON.parse(userStr) as AuthUser;
      login(token, user);
      setStatus('success');
      // Redirect to dashboard
      setTimeout(() => router.replace('/home'), 800);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg('Failed to process authentication. Please try again.');
    }
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center flex flex-col items-center gap-4">
        {status === 'processing' && (
          <>
            <Loader size={32} className="animate-spin text-indigo-400" />
            <p className="text-slate-300 text-sm">Completing sign-in…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-semibold">Signed in successfully!</p>
            <p className="text-slate-400 text-sm">Redirecting to dashboard…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 font-semibold">Authentication failed</p>
            <p className="text-slate-400 text-sm">{errorMsg}</p>
            <button
              onClick={() => router.push('/login')}
              className="glass-button-primary rounded-full px-6 py-2 text-sm font-semibold mt-2"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={32} className="animate-spin text-indigo-400" />
      </div>
    }>
      <AuthCompleteContent />
    </Suspense>
  );
}
