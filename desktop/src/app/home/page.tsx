'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DeviceCard } from '@/components/DeviceCard';
import PermissionsPage from '../permissions/page';
import { motion } from 'framer-motion';

interface DeviceInfo {
  hostname: string;
  platform: string;
  arch: string;
  user: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
  display: {
    width: number;
    height: number;
    scaleFactor: number;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  name: string | null;
  picture: string | null;
  backendToken: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    const fetchData = async () => {
      const state: AuthState = await window.electronAPI.getAuthState();
      if (!state.isAuthenticated) {
        router.replace('/login');
        return;
      }

      const hasMasterKey = await window.electronAPI.hasMasterKey?.();
      if (!hasMasterKey) {
        router.replace('/master-key');
        return;
      }

      setAuthState(state);

      const info = await window.electronAPI.getDeviceInfo();
      setDeviceInfo(info as DeviceInfo);
      const connected = await window.electronAPI.getConnectionStatus();
      setIsConnected(connected);
    };

    fetchData();
    const interval = setInterval(async () => {
      const connected = await window.electronAPI.getConnectionStatus();
      setIsConnected(connected);
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  const handleSignOut = useCallback(async () => {
    if (!window.electronAPI) return;
    setIsSigningOut(true);
    try {
      await window.electronAPI.signOut();
      router.replace('/login');
    } catch (err: any) {
      console.error('Sign out error:', err);
    } finally {
      setIsSigningOut(false);
    }
  }, [router]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 h-fit">

      {/* Auth section */}
      {authState?.isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="rounded-xl border border-white/[0.06] overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="text-indigo-400" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.029 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
              </svg>
              <span className="text-sm font-semibold">Account</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                authState.isAuthenticated
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${authState.isAuthenticated ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {authState.isAuthenticated ? 'Signed In' : 'Not Signed In'}
              </span>
            </div>
          </div>

          <div className="px-4 py-4 bg-black/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {authState.picture && (
                  <img
                    src={authState.picture}
                    alt={authState.name || 'User'}
                    className="w-9 h-9 rounded-full border border-white/10"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{authState.name || authState.email}</p>
                  <p className="text-[11px] text-slate-400">{authState.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-full border border-red-500/20 hover:border-red-500/40 disabled:opacity-50"
              >
                {isSigningOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Device info card — only shown when authenticated */}
      {authState?.isAuthenticated && deviceInfo && (
        <DeviceCard {...deviceInfo} isConnected={isConnected} />
      )}

      {/* Permissions — only shown when authenticated */}
      {authState?.isAuthenticated && (
        <PermissionsPage />
      )}

    </div>
  );
}
