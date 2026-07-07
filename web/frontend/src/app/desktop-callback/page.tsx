'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, MonitorSmartphone } from 'lucide-react';

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
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-zinc-900/50 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl text-center flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-400">
          <MonitorSmartphone size={32} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          WIN in AIR
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
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircle2 size={20} />
              <span>Authentication successful</span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              The desktop app should now be opening automatically. You can safely close this browser tab.
            </p>
            
            <a
              href={deepLink}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Click here if the app didn't open
            </a>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
