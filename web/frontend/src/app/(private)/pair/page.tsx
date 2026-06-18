'use client';

import { useState, useRef, type KeyboardEvent, type ClipboardEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {  Loader, CheckCircle, ArrowRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pairDevice } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import AppLayout from '@/components/AppLayout';
import type { Device } from '@/types';

const LEN = 6;

export default function PairPage() {
  const router = useRouter();
  const { toasts, toast, dismiss } = useToast();
  const qc = useQueryClient();
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(''));
  const [paired, setPaired] = useState<{ name: string; id: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const mutation = useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      const socket = getSocket();
      // Make sure socket is connected
      await new Promise<void>(resolve => {
        if (socket.connected) return resolve();
        socket.once('connect', resolve);
      });
      return pairDevice(code, socket.id ?? '');
    },
    onSuccess: (data) => {
      const device = data.device as Device;
      setPaired({ name: device.name, id: device.id });
      toast('Device paired successfully!', 'success');
   
      if (data?.pairToken) {
         sessionStorage.setItem(`rmac_pair_${device.id}`, data.pairToken);
      }

      // Seed the React Query cache so the control page renders immediately
      // without waiting for an extra GET /devices/:id round trip
      qc.setQueryData(['device', device.id], device);
      qc.setQueryData<Device[]>(['devices'], prev =>
        prev ? [...prev.filter(d => d.id !== device.id), device] : [device]
      );
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const code = digits.join('');

  // Handle digit input
  const handleInput = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < LEN - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === 'Enter' && code.length === LEN) submit();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN);
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, LEN - 1)]?.focus();
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (code.length !== LEN) { toast('Enter all 6 digits', 'error'); return; }
    mutation.mutate({ code });
  };

  if (paired) {
    return (
      <AppLayout>
        <div className="animate-spotlight h-fit mt-20 max-md:mt-52 w-full flex items-center justify-center p-6">
          <div className="text-center animate-fade-up max-w-sm">

            <div className="w-20 h-20 bg-  drop-shadow-emerald-500 drop-shadow-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={36} className="text-emerald-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Paired!</h2>
            <p className="text-slate-400 text-sm mb-6">
              <span className="text-white font-semibold">{paired.name}</span> is now connected.
            </p>
            <button
              onClick={() => router.push(`/control/${paired.id}`)}
              className="  flex items-center gap-3 glass-button-primary rounded-full px-5 !py-2  text-[15px] font-semibold cursor-pointer "
            >
              Open Control Room <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className=" h-fit w-full flex items-center justify-center p-6">
        <div className="w-full flex items-center flex-col animate-fade-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className=" text-5xl drop-shadow-xl drop-shadow-[#ffffff4f]  flex items-center justify-center mx-auto mb-4">
              🔗
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Pair a Device</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Open the Desktop App on your Mac, find the 6-digit pairing code, and enter it below.
            </p>
          </div>
 
          <form onSubmit={submit}>
            <div className="bg-gradient-to-t from-[#1C0B53] to-[#503993] rounded-3xl w-[500px] p-7 mb-4">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest text-center mb-5">
                Pairing Code
              </p>

              <div className="flex gap-2.5 justify-center mb-6">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleInput(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className="code-cell !backdrop-blur-2xl !text-5xl"
                    placeholder="-"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={code.length !== LEN || mutation.isPending}
                className="flex items-center justify-center gap-3 glass-button-primary rounded-full px-5 !py-2  text-[15px] font-semibold cursor-pointer w-full"
              >
                {mutation.isPending
                  ? <><Loader size={15} className="animate-spin" /> Connecting…</>
                  : <>Connect Device <ArrowRight size={15} /></>
                }
              </button>
            </div>
          </form>

          
          <div>
          <div className="bg-blue-500/10 border !w-[500px]  border-blue-500/30 rounded-3xl p-5 ">
            <p className="text-xs font-semibold text-blue-300 mb-3 uppercase tracking-wide">How to get the code</p>
            <ol className="space-y-2.5">
              {[
                'Open the Desktop App app on your Mac',
                'Go to the Pairing tab',
                'Copy the 6-digit code shown',
                'Paste or type it above',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/70 text-gray-100 text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-blue-400">{step}</span>
                </li>
              ))}
            </ol>
          </div>

  
        </div>


        </div>
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </AppLayout>
  );
}
