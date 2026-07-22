'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from 'lucide-react';

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  name: string | null;
  picture: string | null;
}

type Step = 'idle' | 'opening' | 'waiting' | 'exchanging' | 'done' | 'error';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
   

  // Restore auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined' || !window.electronAPI) {
        setChecking(false);
        return;
      }
      try {
        const state: AuthState = await window.electronAPI.getAuthState();
        if (state.isAuthenticated) {
          router.replace('/home');
          return;
        }
      } catch { }
      setChecking(false);
    };
    checkAuth();
  }, [router]);

  // Listen for auth state changes pushed from main process
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;
    window.electronAPI.onAuthStateChanged?.((state: AuthState) => {
      if (state.isAuthenticated) {
        setStep('done');
        setTimeout(() => router.replace('/home'), 600);
      }
    });
  }, [router]);

  const handleSignIn = async () => {
    if (!window.electronAPI || step !== 'idle') return;
    setError(null);
     
    

    try {
      // Step 1: Opening browser
      setStep('opening');
      await new Promise(r => setTimeout(r, 400)); // brief pause for animation

      // Step 2: Waiting
      setStep('waiting');
      const result = await window.electronAPI.signInWithGoogle();

      if (result.success) {
        setStep('done');
        // Check if master key has been set up yet
        const hasMasterKey = await window.electronAPI.hasMasterKey?.();
        if (!hasMasterKey) {
          // First login — redirect to master key setup
          setTimeout(() => router.replace('/master-key'), 600);
        } else {
          setTimeout(() => router.replace('/home'), 700);
        }
      } else {
        throw new Error(result.error || 'Sign-in was cancelled or failed');
      }
    } catch (err: any) {
      setStep('error');
      setError(err.message || 'Sign-in failed');
    }
  };

 
  
  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <motion.div
        className="flex flex-col items-center w-full  "
        style={{ WebkitAppRegion: 'no-drag' } as any}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <motion.div
          className="text-7xl mb-5 drop-shadow-xl"
          animate={{ scale: step === 'done' ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* {step === 'done' ? '✅' : '🖥️'} */}
        </motion.div>
 
        <motion.h1 className="text-7xl font-extrabold logo   text-white mb-2">
          MAC in AIR
        </motion.h1>

        <motion.p className="text-xs text-zinc-400 mb-10 text-center leading-relaxed">
          {step === 'idle' || step === 'error'
            ? 'Sign in to securely connect your Mac to the web dashboard'
            : step === 'opening'
            ? 'Opening your browser…'
            : step === 'waiting'
            ? 'Complete sign-in in your browser, then come back here'
            : step === 'done'
            ? 'Signed in! Redirecting…'
            : ''}
        </motion.p>

        <AnimatePresence mode="wait">
          {/* ── IDLE / ERROR: show button ── */}
          {(step === 'idle' || step === 'error') && (
            <motion.div
              key="btn"
              className="w-full flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <button
                id="google-signin-btn"
                onClick={handleSignIn}
                className="w-fit flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-semibold rounded-2xl px-10 py-3.5 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {error && (
                <motion.div
                  className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="text-sm text-red-400 text-center">{error}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── OPENING: brief transition ── */}
          {step === 'opening' && (
            <motion.div
              key="opening"
              className="flex items-center gap-3 text-zinc-400"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <Spinner />
              <span className="text-sm">Opening browser…</span>
            </motion.div>
          )}

          {/* ── WAITING: fallback ── */}
          {step === 'waiting' && (
            <motion.div
              key="waiting"
              className="flex flex-col w-full gap-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-center gap-3 text-indigo-400 mb-4">
                <Loader className=' animate-spin'/>
                <span className="text-sm font-medium">Waiting for authentication…</span>
              </div>


              {/* { process.env.NODE_ENV === 'development' && <div>
               {!showPaste ? (
                <button
                onClick={() => setShowPaste(true)}
                className="mt-2 flex w-1/2 mx-auto text-center  items-center justify-center  text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2 "
                >
                 <p> App didn't open? Paste link manually (Dev Mode)</p>
                </button>
              ) : (
                <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleManualPaste}
                className="flex w-1/2 mx-auto flex-col gap-3 "
                >
                  <p className="text-[11px] text-zinc-400 text-center px-2">
                    Copy the URL from the browser (macinwind://...) and paste it here:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="macinwind://callback?code=..."
                      value={manualLink}
                      onChange={(e) => setManualLink(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                      autoFocus
                      />
                    <button
                      type="submit"
                      disabled={!manualLink}
                      className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-xl text-sm font-medium transition-colors"
                      >
                      Login
                    </button>
                  </div>
                  
                </motion.form>
              )}
              </div> } */}
            </motion.div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <motion.div
              key="done"
              className="flex items-center gap-3 text-emerald-400 font-semibold"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Spinner color="emerald" />
              <span className="text-sm">Signed in — taking you home…</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p
          className="mt-10 text-xs text-zinc-600 text-center leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Your device is securely linked to your Google account.
          No one else can see or control your machine.
        </motion.p>
      </motion.div>
    </div>
  );
}

// Sub-components  

function Spinner({ color = 'indigo' }: { color?: 'indigo' | 'emerald' }) {
  const cls = color === 'emerald'
    ? 'border-emerald-500 border-t-transparent'
    : 'border-indigo-500 border-t-transparent';
  return (
    <div className={`w-5 h-5 rounded-full border-2 ${cls} animate-spin flex-shrink-0`} />
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2045C17.64 8.5664 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.2045Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5932 3.68182 9C3.68182 8.4068 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1732 0 7.5477 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9255L15.0218 2.3441C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335"/>
    </svg>
  );
}
