'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Search, RefreshCw, Play, Loader } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/hooks/useToast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDevice } from '@/hooks/useDevices';
import { useMutation, useQuery } from '@tanstack/react-query';

interface AppInfo {
  name: string;
  path: string;
  icon?: string | null;
}
function AppIcon({ name, icon, }: { name: string; icon?: string | null; }) {

  const initials = name
    .split(/[\s\-_]+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
  if (icon) {
    return (
      <img
        src={icon}
        alt={name}
        draggable={false}
        className={`rounded-3xl  object-contain select-none w-full h-full`}
        style={{ imageRendering: 'auto' }}
      />
    );
  }

  return (
    <div
      className={`flex items-center glass-panel-card  justify-center rounded-3xl text-4xl font-bold select-none w-full h-full`}
    >
      {initials}
    </div>
  );
}

export default function AppsIcons({ deviceId }: { deviceId?: string | null }) {

  const { toast } = useToast();
  const router = useRouter();

  const { data: device  } = useDevice(deviceId!);

   const [search, setSearch] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  const fetchApps = async () => {
    const result = await sendCommand('LIST_APPS') as {
      success: boolean;
      data?: AppInfo[];
      message?: string;
    };

    if (!result.success) {
       toast('Could not reach desktop agent', result?.message);
      return [];
    }

    return result.data ?? [];
  };

  const { data: apps = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['apps', deviceId],
    queryFn: fetchApps,
    // enabled: !!deviceId
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });


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

  // ⌘+K to focus search
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

 
  const openAppMutation = useMutation({
    mutationFn: async (app: AppInfo) => {
      const result = await sendCommand('OPEN_APP', {
        app: app.name
      });
      return result;
    },

    onSuccess: (_, app) => {
      toast(`Opened ${app.name}`, 'success');
    },

    onError: (err: Error) => {
      toast(err.message, 'error');
    }
  });

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>

      {deviceId && device && <div className="flex items-center  justify-between mb-5 animate-fade-up">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn  glass-panel-dark  !rounded-2xl !p-3">
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
            onClick={() => refetch()}
            disabled={loading}
            className="btn  glass-panel-dark  !rounded-3xl  p-2"
            title="Refresh app list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>}

      {!loading && filtered.length > 0 && <div className="relative animate-spotlight glass-panel-dark py-1 px-5 w-1/2 max-md:w-[90%] max-md:ml-5  mx-auto flex items-center justify-between !rounded-full mb-4 animate-fade-up delay-1">
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
      </div>}

      <div className="flex-1 h-full ">

        {loading && (
          <div className="flex flex-col h-full items-center justify-center py-20 gap-3">
            <Loader className="animate-spin  " size={28} />
            <p className="text-slate-500 text-sm">Scanning applications…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Image src={'/apps.webp'} className=' saturate-0 ' height={65} width={65} alt='apps' />
            <p className="text-slate-400 text-sm font-medium">
              {search ? `No apps matching "${search}"` : ' No apps found '}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(158px,1fr))]  max-md:grid-cols-[repeat(auto-fill,minmax(105px,1fr))] mt-10 mx-auto gap-3 animate-fade-in pb-4">
            {filtered.map((app) => {
               return (
                <button
                  key={app.path}
                  onClick={() => openAppMutation.mutate(app)}
                  disabled={openAppMutation.isPending}
                  className="group flex  flex-col items-center gap-2.5 p-3 cursor-pointer rounded-2xl
                  active:scale-95 transition-all duration-150
                  disabled:opacity-60 disabled:cursor-wait"
                >

                  <div className="w-20 h-20 relative">
                    <AppIcon name={app.name} icon={app.icon} />
                    {openAppMutation.isPending && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                        <Loader size={16} className="animate-spin text-white" />
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
    </>
  )
}
