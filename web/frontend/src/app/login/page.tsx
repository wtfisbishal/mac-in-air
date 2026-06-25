'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiLogin, apiRegister } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toasts, toast, dismiss } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      mode === 'login' ? apiLogin(email, password) : apiRegister(email, password),
    onSuccess: (data) => {
      login(data.token, data.user);
      router.push('/home');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast('Fill in all fields', 'error'); return; }
    mutation.mutate({ email, password });
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[400px]">

          <div className="flex flex-col items-center mb-8 animate-fade-up">

         
            <h1 className="text-5xl  font-black tracking-tight leading-none mt-4 text-transparent bg-clip-text logo-text ">MAC in AIR</h1>

            <p className="text-slate-400 text-sm mt-1">Control your Mac from anywhere</p>
          </div>

          {/* Card */}
          <div className="glass-panel-dark animate-spotlight rounded-4xl p-7 animate-fade-up delay-1">
            {/* Tab toggle */}
            <div className="flex gap-1 glass-panel p-1  !rounded-full mb-6">
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-semibold  !rounded-full   transition-all capitalize
                    ${mode === m
                      ? '  /15 text-indigo-300 border glass-button-primary border-indigo-500/20'
                      : 'text-slate-200 hover:text-slate-300'
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full glass-panel !rounded-2xl outline-none !pl-5 py-2.5 text-sm border "
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full glass-panel !rounded-2xl outline-none !pl-5 py-2.5 text-sm border"
                    placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-200 hover:text-slate-300 transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn glass-button-primary !rounded-full w-full mt-2"
              >
                {mutation.isPending
                  ? <><Loader size={20} className="animate-spin" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
                  : mode === 'login' ? 'Sign In ' : 'Create new Account'
                }
              </button>
            </form>
          </div>


        </div>
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}

function SwiftAppleLogo() {
  return (
    <div className="flex items-center justify-center p-4 bg-gray-950 rounded-xl w-fit cursor-pointer group">
      <div className="relative flex items-center text-5xl transition-transform duration-300 group-hover:scale-105">

        {/* Neon Wind Trail */}
        <span className="absolute -left-8 text-cyan-400 opacity-70 blur-[1px] drop-shadow-[0_0_12px_rgba(34,211,238,0.9)] transition-all duration-300 group-hover:-left-10 group-hover:opacity-100">
          💨
        </span>

        {/* Core Apple */}
        <span className="relative z-10 text-gray-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
          
        </span>

      </div>

      {/* Optional Typography */}
      <span className="ml-4 text-2xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-cyan-400">
        MAC in AIR
      </span>
    </div>
  );
}