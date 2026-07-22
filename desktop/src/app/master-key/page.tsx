'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, ShieldCheck, Loader, AlertTriangle } from 'lucide-react';

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 3) return { score, label: 'Good', color: '#eab308' };
  if (score <= 4) return { score, label: 'Strong', color: '#22c55e' };
  return { score, label: 'Very Strong', color: '#10b981' };
}

export default function MasterKeyPage() {
  const router = useRouter();
  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [done, setDone]                 = useState(false);
  const [checking, setChecking]         = useState(true);

  // Guard: if already set up, skip to home
  useEffect(() => {
    const check = async () => {
      if (typeof window === 'undefined' || !window.electronAPI) {
        setChecking(false);
        return;
      }
      try {
        const authState = await window.electronAPI.getAuthState();
        if (!authState.isAuthenticated) {
          router.replace('/login');
          return;
        }
        const hasMasterKey = await window.electronAPI.hasMasterKey?.();
        if (hasMasterKey) {
          router.replace('/home');
          return;
        }
      } catch { }
      setChecking(false);
    };
    check();
  }, [router]);

  const strength = getStrength(password);
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= 8 && password === confirm && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !window.electronAPI) return;
    setError(null);
    setLoading(true);

    try {
      const result = await window.electronAPI.setupMasterKey?.(password);
      if (result?.success) {
        setDone(true);
        setTimeout(() => router.replace('/home'), 1200);
      } else {
        setError(result?.error || 'Failed to set up master key. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className='animate-spin' />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <motion.div
        className="w-full max-w-sm flex flex-col items-center"
        style={{ WebkitAppRegion: 'no-drag' } as any}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >

        <h1 className="text-4xl logo1  font-bold text-white mb-5">Create Master Key</h1>
        
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              className="flex items-center gap-3 text-emerald-400 font-semibold"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <ShieldCheck size={20} />
              <span className="text-sm">Master key created — redirecting…</span>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    id="master-key-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full   border-b border-white/10   px-4 py-3 pr-12 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white  "
                    autoFocus
                    maxLength={17}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength meter */}
                {password.length > 0 && (
                  <motion.div
                    className="mt-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ backgroundColor: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)' }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px]" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Confirm */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="master-key-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                       maxLength={17}
                    placeholder="Repeat your password"
                    className={`w-full   border-b border-white/10   px-4 py-3 pr-12 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white ${
                      mismatch
                        ? 'border-red-500/50 focus:border-red-500/60'
                        : 'border-white/10 focus:border-indigo-500/60'
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {mismatch && (
                  <p className="text-[11px] text-red-400">Passwords don't match</p>
                )}
              </div>

                         
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-400 text-center">{error}</p>
                </div>
              )}

              <button
                id="create-master-key-btn"
                type="submit"
                disabled={!canSubmit}
                className="w-full flex items-center justify-center gap-2 glass-button-primary disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-3 transition-all duration-200 shadow-lg"
              >
                {loading
                  ? <><Loader size={16} className="animate-spin" /> Creating…</>
                  : <><Lock size={16} /> Create Master Key</>
                }
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-8 text-[11px] text-zinc-600 text-center leading-relaxed">
          This key is derived locally using PBKDF2 + HMAC-SHA256.
          <br />
          Only a hash is shared with the server — never the password.
        </p>

        <p className='whitespace-nowrap mt-5 border border-yellow-500/40 text-yellow-500 bg-yellow-300/10 flex items-center gap-1 text-xs p-1 rounded-full'><AlertTriangle size={12}/> This key is not  recoverable you can change password by logout and login again </p>
      </motion.div>
    </div>
  );
}
