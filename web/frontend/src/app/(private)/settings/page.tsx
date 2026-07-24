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
        
        <div className="space-y-5 animate-fade-up delay-1">

          <div className="glass-panel-card rounded-3xl p-5">
            <h1 className=' font-bold'>Account</h1>
            <div className="  rounded-xl p-3 flex items-center gap-3">
              <div className="w-20 h-20 glass-button-primary p-1  overflow-hidden rounded-full  flex items-center justify-center text-sm font-bold  ">
                <Image height={100} width={100} className=' rounded-full' src={user?.picture!} alt="" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-200">{user?.email ?? '—'}</p>
                <p className="text-xs text-slate-500">Logged in</p>
              </div>
            </div>
              <button
              onClick={handleLogout}
              className="w-full flex mt-5 items-center gap-3 px-3 py-2.5 glass-button-red "
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
  