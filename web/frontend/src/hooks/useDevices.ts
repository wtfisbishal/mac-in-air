'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDevices, fetchDevice, sendCommand } from '@/lib/api';

export const DEVICES_KEY = ['devices'] as const;

export function useDevices() {
  return useQuery({
    queryKey: DEVICES_KEY,
    queryFn: fetchDevices,
    refetchInterval: 10_000, // poll every 10 s for online/offline changes
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ['device', id],
    queryFn: () => fetchDevice(id),
    enabled: !!id,
    refetchInterval: 8_000,
  });
}

export function useSendCommand(deviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, payload }: { type: string; payload?: Record<string, unknown> }) =>
      sendCommand(deviceId, type, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DEVICES_KEY });
    },
  });
}
