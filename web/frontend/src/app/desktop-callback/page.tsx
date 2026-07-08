'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, MonitorSmartphone } from 'lucide-react';
import Image from 'next/image';

export default function DesktopCallbackPage() {
  const [status, setStatus] = useState<'redirecting' | 'done'>('redirecting');
  const [deepLink, setDeepLink] = useState('');

  useEffect(() => {
    // Ensure we are in the browser
    if (typeof window === 'undefined') return;

    // Grab all query parameters Google sent us (code, scope, authuser, etc)
    const searchParams = window.location.search;
    
    // Construct the deep link to the desktop app
    const link = `macinair://callback${searchParams}`;
    setDeepLink(link);

    // Attempt to open the desktop app
    window.location.href = link;

    // After a short delay, update the UI to assume it worked
    const timer = setTimeout(() => {
      setStatus('done');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen  flex items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className=" text-center flex flex-col items-center"
      >
        {/* <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-400"> */}
          <Image src={'/logo.webp'} height={150} width={150} alt='' />
        {/* </div> */}

        <h1 className="text-5xl font-bold text-white my-3">
          MAC in AIR
        </h1>

        {status === 'redirecting' ? (
          <div className="flex flex-col items-center gap-4 text-zinc-400">
            <Loader2 className="animate-spin text-indigo-400" size={24} />
            <p>Returning you to the desktop app...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-2 text-emerald-400 text-3xl font-bold">
              <span className=' bg-linear-to-br to-green-600 from-emerald-200 text-transparent bg-clip-text '>You have successfully authenticated.</span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              The desktop app should now be opening automatically. You can safely close this browser tab.
            </p>
            
            <a
              href={deepLink}
              className="px-6 py-2.5 glass-button-primary  rounded-full  font-medium transition-colors"
            >
              Click here if the app didn't open
            </a>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
