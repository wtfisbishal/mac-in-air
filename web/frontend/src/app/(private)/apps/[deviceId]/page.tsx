'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, RefreshCw, Loader2,  Play, MonitorOff, Link as Link2,ShieldAlert
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useDevice } from '@/hooks/useDevices';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import AppLayout from '@/components/AppLayout';
import Image from 'next/image';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ deviceId: string }>;
}

interface AppInfo {
  name: string;
  path: string;
  icon?: string | null;
}
function getAppStyle(name: string): { color: string; bg: string } {
  const lower = name.toLowerCase();

  return { color: '#818cf8', bg: 'rgba(129,140,248,.15)' };
}

function AppIcon({
  name,
  icon,
  size = 'md',
}: {
  name: string;
  icon?: string | null;
  size?: 'sm' | 'md';
}) {
  const style = getAppStyle(name);
  const initials = name
    .split(/[\s\-_]+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  const rounded = size === 'sm' ? 'rounded-xl' : 'rounded-2xl';


  if (icon) {
    return (
      <img
        src={icon}
        alt={name}
        draggable={false}
        className={`${rounded}  object-contain select-none w-full h-full`}
        style={{ imageRendering: 'auto' }}
      />
    );
  }

  return (
    <div
      className={`flex items-center glass-panel-dark justify-center rounded-3xl text-4xl font-bold select-none w-full h-full`}
    >
      {initials}
    </div>
  );
}

export default function AppsPage({ params }: PageProps) {
  const { deviceId } = use(params);
  const router = useRouter();
  const { data: device, isLoading: deviceLoading } = useDevice(deviceId);
  const { toasts, toast, dismiss } = useToast();

  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  const sendCommand = useCallback(
    (type: string, payload?: Record<string, unknown>) =>
      new Promise<{ success: boolean; message?: string; data?: unknown }>((resolve) => {
        const socket = getSocket();
        socket.emit('command', { type, payload }, (res: { success: boolean; message: string; data?: unknown }) => {
          resolve(res ?? { success: false, message: 'No response from desktop' });
        });
      }),
    []
  );

  const [pairToken, setPairToken] = useState<string | null>(null);
  
  useEffect(() => {
    const token = sessionStorage.getItem(`rmac_pair_${deviceId}`);
    setPairToken(token);
  }, [deviceId]);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const result = await sendCommand('LIST_APPS') as { success: boolean; data?: AppInfo[]; message?: string };
      if (result.success && Array.isArray(result.data)) {
        setApps(result.data);
      } else {
        toast(result.message ?? 'Failed to list apps', 'error');
      }
    } catch {
      toast('Could not reach desktop agent', 'error');
    } finally {
      setLoading(false);
    }
  }, [sendCommand, toast]);

  useEffect(() => { loadApps(); }, [loadApps]);

  // ⌘K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const openApp = async (app: AppInfo) => {
    setOpening(app.name);
    try {
      const result = await sendCommand('OPEN_APP', { app: app.name }) as { success: boolean; message?: string };
      if (result.success) {
        toast(`Opened ${app.name}`, 'success');
      } else {
        toast(result.message ?? `Failed to open ${app.name}`, 'error');
      }
    } finally {
      setOpening(null);
    }
  };

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (deviceLoading) return (
    <AppLayout>
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    </AppLayout>
  );

  if (!device) return (
    <AppLayout>
      <div className=" w-full   flex items-center justify-center">
        <div className="text-center">
          <MonitorOff size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Device not found</p>
          <button onClick={() => router.push('/home')} className="btn btn-ghost mt-4 text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    </AppLayout>
  );
if (!pairToken) return (
    <AppLayout>
      <div className="w-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Not Authorized</h2>
          <p className="text-slate-400 text-sm mb-6">
            You must pair this device before you can control it.
            Pairing tokens expire after 15 min  or when you close the tab.
          </p>
          <Link href="/pair" className="btn !rounded-full glass-button-primary">
          <Link2 size={20}/>
            Pair Device
          </Link>
        </div>
      </div>
    </AppLayout>
  );
  return (
    <AppLayout>
      <div className="flex flex-col w-full  max-md:mt-0 h-screen p-5">

        <div className="flex items-center justify-between mb-5 animate-fade-up">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="btn btn-ghost glass-panel-dark  !rounded-2xl !p-3">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg max-md:text-sm font-bold text-white leading-tight">
                Apps — <span className="text-indigo-400 capitalize"> {device?.user}'s {device.name}</span>
              </h1>
              <p className="text-xs text-slate-500">
                {loading ? 'Loading…' : `${filtered.length} of ${apps.length} apps`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">


            <button
              onClick={loadApps}
              disabled={loading}
              className="btn btn-ghost glass-panel-dark  !rounded-3xl  p-2"
              title="Refresh app list"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>


        <div className="relative glass-panel-dark py-1 px-5 w-1/2 max-md:w-full  mx-auto flex items-center justify-between !rounded-full mb-4 animate-fade-up delay-1">
          <Search size={17} className=" text-slate-200 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search apps… (⌘K)"
            className=" !w-full border-none outline-none !pl-2 py-2.5 ml-2 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="   text-slate-200 hover:text-slate-300 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Content  */}
        <div className="flex-1 ">

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-indigo-400" size={28} />
              <p className="text-slate-500 text-sm">Scanning applications…</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              {/* <AppWindow size={36} className="text-slate-600" /> */}
              <Image src={'/apps.png'} height={65} width={65} alt='apps' />
              <p className="text-slate-400 text-sm font-medium">
                {search ? `No apps matching "${search}"` : 'No apps found'}
              </p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(158px,1fr))]   mx-auto gap-3 animate-fade-in pb-4">
              {filtered.map((app) => {
                const isOpening = opening === app.name;
                return (
                  <button
                    key={app.path}
                    onClick={() => openApp(app)}
                    disabled={isOpening}
                    className="group flex  flex-col items-center gap-2.5 p-3 cursor-pointer rounded-2xl
                      active:scale-95 transition-all duration-150
                      disabled:opacity-60 disabled:cursor-wait"
                  >
                    
                    <div className="w-20 h-20 relative">
                      <AppIcon name={app.name} icon={app.icon} size='md' />
                      {isOpening && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                          <Loader2 size={16} className="animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    
                    <span className="text-[11px] text-slate-300 group-hover:text-white font-medium text-center leading-tight line-clamp-2 w-full">
                      {app.name}
                    </span>
                     
                    <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[9px] text-indigo-400 font-semibold transition-opacity">
                      <Play size={8} fill="currentColor" /> Launch
                    </span>
                  </button>
                );
              })}
            </div>
          )}


        </div>
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </AppLayout>
  );
}
