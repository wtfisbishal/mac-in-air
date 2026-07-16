'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { Device } from '@/types';
import { DEVICES_KEY } from '@/hooks/useDevices';

function GlobalDeviceListener() {
  const { socket } = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { deviceId: string; isOnline: boolean }) => {
      qc.setQueryData<Device[]>(DEVICES_KEY, prev => {
        const current = prev || [];
        const exists = current.find(d => d.id === payload.deviceId);
        
        if (!exists) {
           setTimeout(() => qc.invalidateQueries({ queryKey: DEVICES_KEY }), 0);
           return current;
        }

        const next = current.map(d => d.id === payload.deviceId ? { ...d, isOnline: payload.isOnline } : d);
          
        if (typeof window !== 'undefined') {
          localStorage.setItem('devices-cache', JSON.stringify(next));
        }
        return next;
      });
    };
    socket.on('device-status-changed', handler);
    return () => { socket.off('device-status-changed', handler); };
  }, [socket, qc]);

  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !isAuthenticated) router.replace('/login');
  }, [ready, isAuthenticated, router]);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      {/* <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /> */}
      <Loader className="animate-spin" size={20} />
    </div>
  );

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen  mx-auto !w-full">
       <GlobalDeviceListener />
        {children}
    </div>
  );
}
