'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

export function useSocket() {
  const ref = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    ref.current = s;
    if (s.connected) setIsConnected(true);

    const onConnect    = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    s.on('connect',    onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect',    onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket: ref.current, isConnected };
}
