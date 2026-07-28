'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const { isAuthenticated, ready } = useAuth();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  // Redirect if already authenticated
  useEffect(() => {
    if (ready && isAuthenticated) {
      router.replace('/home');
    }
  }, [ready, isAuthenticated, router]);

  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google';
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={24} className="animate-spin " />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8 animate-fade-up">
          <h1 className="text-5xl font-black tracking-tight leading-none mt-4 text-transparent bg-clip-text logo-text">
            MAC in AIR
          </h1>
          <p className="text-slate-400 text-sm mt-1">Control your Mac from anywhere</p>
        </div>

        {/* Card */}
        <div className="glass-panel-dark animate-spotlight rounded-4xl p-7 animate-fade-up delay-1">

          
          {error && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {decodeURIComponent(error).replace(/_/g, ' ')}
            </div>
          )}

          <div className="flex flex-col items-center gap-6 py-2">
            <div className="text-center">
              <p className="text-slate-200 text-[15px] font-medium mb-1">
                Sign in to your account
              </p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Use the same Google account as your desktop app.<br/>
                Your Macs will appear automatically.
              </p>
            </div>
 
            <button
              id="google-signin-btn"
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-3 w-full glass-button-primary rounded-2xl! py-3 px-5 text-[15px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-2 w-full px-2">
              <div className="h-px flex-1 bg-white/[0.07]" />
              <span className="text-[11px] text-slate-500 font-medium">Secure sign-in</span>
              <div className="h-px flex-1 bg-white/[0.07]" />
            </div>

            <p className="text-[11px] text-slate-600 text-center leading-relaxed">
              By signing in you agree to our terms. Your Google account credentials are never shared with this server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={24} className="animate-spin " />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}