'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Link2, Settings,
  LogOut,  Wifi, WifiOff, ChevronRight,
  
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';

const NAV = [
  { href: '/home',  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/pair',       label: 'Pair Device',   icon: Link2 },
  { href: '/settings',   label: 'Settings',      icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const { isConnected }  = useSocket();

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <aside className="fixed !p-2  h-screen left-0 w-[220px] flex flex-col !gap-3 glass border-r border-white/[0.05] z-40">
    
      <div className="px-5 pt-6 !pb-5">
        <Link href="/home" className="flex flex-col items-center gap-3 group">
        
          <div className='  '>
          <img src="/logo.png" height={90} width={90} className=' object-fit' alt="" />

          </div>
          <div className="leading-none">
            <p className="text-xl font-bold text-white tracking-tight"> MAC in AIR</p>
          </div>
        </Link>
      </div>

     
      <div className="mx-3 mb-4 px-3 py-2 rounded-lg bg-slate-900/50 flex items-center gap-2">
        {isConnected
          ? <><Wifi size={13} className="text-emerald-400" /><span className="text-[11px] text-emerald-400 font-semibold">Backend connected</span></>
          : <><WifiOff size={13} className="text-slate-500" /><span className="text-[11px] text-slate-500 font-semibold">Disconnected</span></>
        }
      </div>

      
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center !gap-3 !px-3 h-10 rounded-xl text-sm font-medium transition-all relative group
                ${active
                  ? 'text-white bg-indigo-500/10 border border-indigo-500/15'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
            >
              {active && (
                <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-[3px] h-10 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-l-xl" />
              )}
              <Icon size={16} className={active ? 'text-indigo-400' : ''} />
              <span>{label}</span>
              {active && <ChevronRight size={12} className="ml-auto text-indigo-400/50" />}
            </Link>
          );
        })}
      </nav>

      
      <div className="p-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/25 to-purple-500/25 flex items-center justify-center text-xs font-bold text-indigo-300 border border-indigo-500/15">
            {user?.email?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <p className="text-xs text-slate-300 truncate flex-1">{user?.email ?? 'User'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
