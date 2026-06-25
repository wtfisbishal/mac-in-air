 
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 2900);
    const navTimer = setTimeout(() => router.replace('/home'), 2900);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [router]);

  return (
    <motion.div
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="relative flex min-h-full pt-40 flex   items-center justify-center  overflow-hidden"
    >
      {/* subtle center glow */}
      <div className="pointer-events-none absolute inset-0 " />

      <div className="relative z-10 flex flex-col items-center">
        
        <motion.h1
          className="logo bg-clip-text text-transparent text-7xl font-semibold tracking-tight"
          initial={{ y: 16, opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
        >
          Mac in AIR
        </motion.h1>

        <motion.p
          className="mt-2  text-sm text-zinc-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Control your Mac from anywhere
        </motion.p>

        <motion.div
          className="mt-10 h-[2px] w-32 overflow-hidden rounded-full bg-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div
            className="h-full w-1/3 rounded-full bg-white/80"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}