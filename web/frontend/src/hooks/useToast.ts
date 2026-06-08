'use client';

import { useState, useCallback, useRef } from 'react';
import type { ToastKind } from '@/types';

interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

let counter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(p => p.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, kind: ToastKind = 'info', duration = 3500) => {
    const id = `t${++counter}`;
    setToasts(p => [...p, { id, message, kind }]);
    const timer = setTimeout(() => dismiss(id), duration);
    timers.current.set(id, timer);
  }, [dismiss]);

  return { toasts, toast, dismiss };
}
