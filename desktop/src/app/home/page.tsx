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
          className="rounded-xl border    glass-panel-dark overflow-hidden"
        >

          <div className="px-4 py-4 bg-black/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {authState.picture && (
                  <div className=' glass-button-primary rounded-full p-0.5 '>
                    <img
                      src={authState.picture}
                      alt={authState.name || 'User'}
                      className="w-12 h-12 rounded-full border border-white/10"
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{authState.name || authState.email}</p>
                  <p className="text-[11px] text-slate-400">{authState.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-xs font-semibold px-4 py-2 rounded-full cursor-pointer glass-button-red disabled:opacity-50"
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
