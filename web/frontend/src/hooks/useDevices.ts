'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDevices, fetchDevice, sendCommand } from '@/lib/api';

export const DEVICES_KEY = ['devices'] as const;

export function useDevices() {
  return useQuery({
    queryKey: DEVICES_KEY,
     queryFn: async () => {
      const data = await fetchDevices();
      if (typeof window !== 'undefined') {
        localStorage.setItem('devices-cache', JSON.stringify(data));
      }
      return data;
    },
    initialData: () => {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('devices-cache');
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            return undefined;
          }
        }
      }
      return undefined;
    },
    refetchOnWindowFocus: false,
    
  });
}

export function useDevice(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['device', id],
    queryFn: () => fetchDevice(id),
    enabled: !!id,
    // refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    initialData: () => {
      const devices = qc.getQueryData<any[]>(DEVICES_KEY);
      return devices?.find(d => d.id === id);
    }
  });
}