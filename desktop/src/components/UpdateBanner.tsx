'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type UpdateState =
  | { status: 'idle' }
  | { status: 'available'; version: string }
  | { status: 'downloading'; percent: number; version: string }
  | { status: 'downloaded'; version: string }
  | { status: 'error'; message: string };

export default function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateState>({ status: 'idle' });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    const api = window.electronAPI;

    api.onUpdateAvailable?.((info) => {
      setDismissed(false);
      setUpdate({ status: 'available', version: info.version });
    });

    api.onUpdateProgress?.((p) => {
      setUpdate((prev) => ({
        status: 'downloading',
        percent: p.percent,
        version: 'version' in prev ? (prev as any).version : '',
      }));
    });

    api.onUpdateDownloaded?.((info) => {
      setUpdate({ status: 'downloaded', version: info.version });
    });

    api.onUpdateError?.((err) => {
      setUpdate({ status: 'error', message: err.message });
    });
  }, []);

  const handleInstall = () => {
    window.electronAPI?.installUpdate?.();
  };

  const visible = !dismissed && update.status !== 'idle';

  return (
    <>
      <AnimatePresence>
        { visible && (
          <motion.div
            key="update-banner"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-5 right-5 z-[200] w-72 rounded-full border border-white/10 bg-[#0d0d0d]/90 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            {/* top accent line */}
            <div
              className={`h-[2px] w-full ${
                update.status === 'error'
                  ? 'bg-red-500/50'
                  : update.status === 'downloaded'
                  ? 'bg-emerald-400/50'
                  : 'bg-indigo-500/50'
              }`}
            />

            <div className="p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {update.status === 'error' ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/15 text-red-400 text-[11px]">✕</span>
                  ) : update.status === 'downloaded' ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-[11px]">↓</span>
                  ) : (
                    <motion.span
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300 text-[11px]"
                      animate={{ rotate: update.status === 'downloading' ? 360 : 0 }}
                      transition={
                        update.status === 'downloading'
                          ? { duration: 1.5, repeat: Infinity, ease: 'linear' }
                          : {}
                      }
                    >
                      ↻
                    </motion.span>
                  )}

                  <p className="text-[13px] font-semibold text-white leading-tight">
                    {update.status === 'available' && 'Update available'}
                    {update.status === 'downloading' && 'Downloading update…'}
                    {update.status === 'downloaded' && 'Ready to install'}
                    {update.status === 'error' && 'Update failed'}
                  </p>
                </div>

                <button
                  onClick={() => setDismissed(true)}
                  className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors text-[13px] leading-none mt-0.5"
                  aria-label="Dismiss update notification"
                >
                  ✕
                </button>
              </div>

              {update.status === 'available' && (
                <p className="text-[11px] text-zinc-400">
                  v{update.version} is available — downloading now…
                </p>
              )}

              { update.status === 'downloading' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>Downloading</span>
                    <span>{update.percent}%</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-indigo-500"
                      initial={{ width: '0%' }}
                      animate={{ width: `${update.percent}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}

              {update.status === 'downloaded' && (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-zinc-400">
                    v{update.version} is ready. Restart to apply the update.
                  </p>
                  <button
                    onClick={handleInstall}
                    id="update-restart-btn"
                    className="w-full rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 text-[12px] font-semibold py-2 transition-all duration-200 active:scale-[0.97]"
                  >
                    Restart &amp; Update
                  </button>
                </div>
              )}

              {update.status === 'error' && (
                <p className="text-[11px] text-red-400/80 break-words">
                  {update.message}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

  
    </>
  );
}

  