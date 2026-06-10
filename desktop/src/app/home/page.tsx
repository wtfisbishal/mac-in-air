'use client';

import { useEffect, useState } from 'react';
import { DeviceCard } from '@/components/DeviceCard';
import { StatusBadge } from '@/components/StatusBadge';
import PairingStatusWidget from '@/components/PairingStatusWidget';
import { Monitor, Globe } from 'lucide-react';
import Link from 'next/link';

interface DeviceInfo {
  hostname: string;
  platform: string;
  arch: string;
  user: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
}

interface WebClient {
  socketId: string;
  connectedAt: number;
}

export default function DashboardPage() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [webClients, setWebClients] = useState<WebClient[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const fetchData = async () => {
        const info = await window.electronAPI.getDeviceInfo();
        setDeviceInfo(info);
        const connected = await window.electronAPI.getConnectionStatus();
        setIsConnected(connected);
        const clients = await window.electronAPI.getConnectedClients?.() ?? [];
        console.log(clients)
        setWebClients(clients);
      };
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }

  }, []);

   

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 h-fit  ">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Home</h1>

        </div>
        <StatusBadge status={isConnected ? 'online' : 'offline'} label={isConnected ? 'Connected to Server' : 'Disconnected'} />
      </div>


      {!isConnected && <PairingStatusWidget />}

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-indigo-400" />
            <span className="text-sm font-semibold">Active Web Sessions</span>
            {webClients.length > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {webClients.length} active
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-600 font-mono">updates every 3s</span>
        </div>

        {webClients.length === 0 ? (
          <div className="flex items-center gap-3 bg-black/20 px-4 py-5 text-gray-600 text-sm">
            <Monitor size={16} />
            No web clients connected
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {webClients.map((client) => {
              const connectedMins = Math.floor((Date.now() - client.connectedAt) / 60000);
              const connectedSecs = Math.floor((Date.now() - client.connectedAt) / 1000) % 60;
              const duration = connectedMins > 0 ? `${connectedMins}m ${connectedSecs}s` : `${connectedSecs}s`;
              return (
                <li key={client.socketId} className="flex items-center bg-black/20 gap-3 px-4 py-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-300 truncate">
                      {client.socketId.slice(0, 8)}…{client.socketId.slice(-4)}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Connected {duration} ago · {new Date(client.connectedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex-shrink-0">
                    Live
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

 {/* <Link className='glass-button' href='/'>home</Link> */}
      {deviceInfo && (
        <DeviceCard {...deviceInfo} isConnected={isConnected} />
      )}
    </div>
  );
}
