'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Monitor, Cpu, HardDrive, Plus, RefreshCw, Circle, Zap, Link as Link3, Wifi, WifiOffIcon, } from 'lucide-react';
import { useDevices, DEVICES_KEY } from '@/hooks/useDevices';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import AppLayout from '@/components/AppLayout';
import { useQueryClient } from '@tanstack/react-query';
import type { Device } from '@/types';

function DeviceCard({ device }: { device: Device }) {
  const platform = device.platform === 'darwin' ? '' : device.platform === 'win32' ? '🪟' : '🐧';

   return (
    <div className={`bg-gradient-to-t  from-[#0E161B] to-[#374750 glass-panel-card rounded-3xl p-5 transition-all   group
      ${device.isOnline ? ' ' : 'border border-white/[0.04] opacity-70'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-indigo-500/10 flex items-center justify-center text-4xl">
            {platform}
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight capitalize"> {device?.user}'s {device.name}</p>
            <p className="text-xs text-slate-200 mt-0.5">{device.platform} · {device.arch}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full
          ${device.isOnline
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
            : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          <span className={device.isOnline ? 'dot-online' : 'dot-offline'} />
          {device.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-[#0000002f] rounded-2xl p-3 flex items-center gap-2">
          <Cpu size={13} className="text-indigo-400" />
          <div>
            <p className="text-[10px] text-slate-200">Platform</p>
            <p className="text-xs font-semibold text-slate-200">{device.platform}</p>
          </div>
        </div>
        <div className="bg-[#0000002f] rounded-2xl p-3 flex items-center gap-2">
          <HardDrive size={13} className="text-purple-400" />
          <div>
            <p className="text-[10px] text-slate-200">Arch</p>
            <p className="text-xs font-semibold text-slate-200">{device.arch}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/control/${device.id}`}
          className={`btn !rounded-full glass-button-primary flex-1 text-xs py-2 ${device.isOnline ? 'glass-button-primary' : 'glass-button opacity-40 pointer-events-none'}`}
        >
            Control
        </Link>

      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: devices, isLoading, isError, error, refetch } = useDevices();
  const { socket } = useSocket();
  const { toasts, toast, dismiss } = useToast();
  const qc = useQueryClient();
 
  useEffect(() => {
    if (!socket) return;
    const handler = (data: { deviceId: string; isOnline: boolean }) => {
      qc.setQueryData<Device[]>(DEVICES_KEY, prev =>
        prev?.map(d => d.id === data.deviceId ? { ...d, isOnline: data.isOnline } : d)
      );
      toast(`Device ${data.isOnline ? 'came online' : 'went offline'}`, data.isOnline ? 'success' : 'info');
    };
    socket.on('device-status-changed', handler);
    return () => { socket.off('device-status-changed', handler); };
  }, [socket, qc, toast]);

  const online = devices?.filter(d => d.isOnline).length ?? 0;
  const total = devices?.length ?? 0;

  return (
    <AppLayout>
      <div className=" !p-7 max-md:w-full  w-[70%] mx-auto">
        {/* Header */}
        <div className="flex items-center max-md:items-start max-md:gap-4 max-md:flex-col justify-between mb-7 animate-fade-up">

          <div>
            <h1 className="text-6xl font-bold text-white mb-5 tracking-tight">MACS</h1>
          </div>

          <div className="flex items-center max-md:gap-6 max-md:w-full   gap-3">
            <button onClick={() => refetch()} className="flex items-center gap-3 glass-button  rounded-full px-5 !py-2 text-[15px] font-semibold cursor-pointer">
              <RefreshCw size={13} /> Refresh
            </button>
            <Link href="/pair" className=" flex items-center gap-3 glass-button-primary rounded-full px-5 !py-2  text-[15px] font-semibold cursor-pointer">
              <Link3 size={14} /> Pair Device
            </Link>
          </div>

        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 max-md:grid-cols-2  gap-4 mb-7 animate-fade-up delay-1">
          {[
            { label: 'Online Now', value: online, icon: Wifi, color: 'text-emerald-400' },
            { label: 'Offline', value: total - online, icon: WifiOffIcon, color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="glass-panel-dark !rounded-3xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#ffffff45] flex items-center justify-center">
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{isLoading ? '—' : s.value}</p>
                <p className="text-xs text-slate-300">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Device list */}
        <div className="animate-fade-up delay-2">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Devices</h2>

          {isLoading && (
            <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
              {[1, 2].map(i => (
                <div key={i} className="glass-panel-dark rounded-3xl p-5 space-y-3">
                  <div className="skeleton h-5 w-2/3" />
                  <div className="skeleton h-4 w-1/3" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="skeleton h-14 rounded-xl" />
                    <div className="skeleton h-14 rounded-xl" />
                  </div>
                  <div className="skeleton h-9 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="glass-panel-dark h-[200px] flex items-center justify-center rounded-3xl p-6 text-center text-red-400 border border-red-500/10">
              <p className="text-sm font-medium">Failed to load devices</p>
              {/* <p className="text-xs text-red-400/60 mt-1">{(error as Error).message}</p> */}
            </div>
          )}

          {!isLoading && !isError && devices?.length === 0 && (
            <div className=" glass-panel-dark rounded-3xl p-12 text-center  ">
              <Monitor size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No devices yet</p>
              <p className="text-slate-600 text-sm mt-1">Pair your Mac to get started</p>
              <Link href="/pair" className="btn glass-button-primary !rounded-full mx-auto mt-4 text-sm">
                <Plus size={14} /> Pair Device
              </Link>
            </div>
          )}

          {!isLoading && !isError && devices && devices.length > 0 && (
            <div className="grid grid-cols-2 w-full max-md:grid-cols-1 gap-4">
              {devices.map(d => <DeviceCard key={d.id} device={d} />)}
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </AppLayout>
  );
}
