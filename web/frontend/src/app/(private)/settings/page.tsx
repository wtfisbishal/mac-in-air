'use client';

import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import AppLayout from '@/components/AppLayout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
 
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toasts, dismiss } = useToast();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <AppLayout>
      <div className="p-7  max-md:w-full  w-[70%]  mx-auto">
        <div className="mb-7 animate-fade-up">
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        </div>

        <div className="space-y-5 animate-fade-up delay-1">

          <div className="glass-panel-card rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={15} className="text-indigo-400" />
              <p className="text-sm font-semibold text-white">Account</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 border border-indigo-500/10">
                {user?.email?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{user?.email ?? '—'}</p>
                <p className="text-xs text-slate-500">Logged in</p>
              </div>
            </div>
              <button
              onClick={handleLogout}
              className="w-full flex  mt-5 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>

          


          <div className="px-5 pt-6 !pb-5">
            <Link href="/home" className="flex flex-col items-center gap-3 group">

              <div className='  '>
                <Image loading='lazy' src="/logo.webp" height={90} width={90} className='drop-shadow-[#f6f6f63b] drop-shadow-2xl  object-fit' alt="" />

              </div>
              <div className="leading-none">
                <p className="text-xl font-bold text-white tracking-tight">MAC in AIR</p>
              </div>
            </Link>
          </div>

        </div>
 
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </AppLayout>
  );
}
  