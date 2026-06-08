'use client';

import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import type { ToastKind } from '@/types';

interface ToastProps {
  id: string;
  message: string;
  kind: ToastKind;
  onDismiss: (id: string) => void;
}

const cfg = {
  success: { icon: CheckCircle, bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-300' },
  error:   { icon: XCircle,     bg: 'bg-red-500/10 border-red-500/20',         text: 'text-red-300'     },
  info:    { icon: Info,        bg: 'bg-indigo-500/10 border-indigo-500/20',    text: 'text-indigo-300'  },
} as const;

export function ToastItem({ id, message, kind, onDismiss }: ToastProps) {
  const { icon: Icon, bg, text } = cfg[kind];
  return (
    <div className={`animate-slide-in flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-lg min-w-[280px] max-w-[360px] shadow-2xl ${bg}`}>
      <Icon size={16} className={text} />
      <p className={`flex-1 text-sm font-medium ${text}`}>{message}</p>
      <button onClick={() => onDismiss(id)} className="text-slate-500 hover:text-slate-300 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: { id: string; message: string; kind: ToastKind }[];
  dismiss: (id: string) => void;
}

export function ToastContainer({ toasts, dismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
