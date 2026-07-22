'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      let target = '/login';

      if (typeof window !== 'undefined' && window.electronAPI) {
        try {
          const state = await window.electronAPI.getAuthState();
          target = state.isAuthenticated ? '/home' : '/login';
        } catch {
          target = '/login';
        }
      } else {
        // In browser dev mode — go to home
        target = '/home';
      }

      const exitTimer = setTimeout(() => setExiting(true), 2200);
      const navTimer = setTimeout(() => router.replace(target), 2500);
      return () => {
        clearTimeout(exitTimer);
        clearTimeout(navTimer);
      };
    };

    const cleanup = checkAuthAndNavigate();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [router]);

  return (
    <motion.div
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="relative flex min-h-full pt-40 flex items-center justify-center overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center">
        
        <motion.h1
          className="logo text-7xl text-[#ffffff88] font-bold"
          initial={{ y: 16, opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
        >
          MAC in AIR
        </motion.h1>

        <motion.p
          className="mt-5 text-sm text-zinc-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Control your Mac from anywhere
        </motion.p>
      </div>
    </motion.div>
  );
}