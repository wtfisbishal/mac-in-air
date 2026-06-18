'use client';

import { use, useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import {  Loader,  MonitorOff, Link as Link2, ShieldAlert
} from 'lucide-react';
import { useDevice } from '@/hooks/useDevices';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import AppsIcons from '../_components/AppsIcons';

interface PageProps {
  params: Promise<{ deviceId: string }>;
}
 
export default function AppsPage({ params }: PageProps) {
  const { deviceId } = use(params);
  const router = useRouter();
  const { data: device, isLoading: deviceLoading } = useDevice(deviceId);
  const { toasts, dismiss } = useToast();
  const [pairToken, setPairToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(`rmac_pair_${deviceId}`);
    setPairToken(token);
  }, [deviceId]);

  if (deviceLoading) return (
    <AppLayout>
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader className="animate-spin  " size={32} />
      </div>
    </AppLayout>
  );

  if (!device) return (
    <AppLayout>
      <div className=" w-full   flex items-center justify-center">
        <div className="text-center">
          <MonitorOff size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Device not found</p>
          <button onClick={() => router.push('/home')} className="btn btn-ghost mt-4 text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    </AppLayout>
  );
  if (!pairToken) return (
    <AppLayout>
      <div className="w-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Not Authorized</h2>
          <p className="text-slate-400 text-sm mb-6">
            You must pair this device before you can control it.
            Pairing tokens expire after 15 min  or when you close the tab.
          </p>
          <Link href="/pair" className="btn !rounded-full glass-button-primary">
            <Link2 size={20} />
            Pair Device
          </Link>
        </div>
      </div>
    </AppLayout>
  );
  return (
    <AppLayout>
      <div className="flex flex-col w-full  max-md:mt-0 h-screen p-5">

        <AppsIcons deviceId={deviceId} />

      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </AppLayout>
  );
}

