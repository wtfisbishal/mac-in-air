'use client';

import { useEffect, useState } from 'react';
import { PermissionCard } from '@/components/PermissionCard';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<any>(null);

  const loadPermissions = async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const perms = await window.electronAPI.getAllPermissions();
      setPermissions(perms);
    }
  };

  useEffect(() => {
    loadPermissions();
    const interval = setInterval(loadPermissions, 3000);
    return () => clearInterval(interval);
  }, []);

  const requestAccessibility = async () => {
    if (window.electronAPI) {
      await window.electronAPI.requestAccessibility();
      await loadPermissions();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Permissions</h1>
        <p className="text-sm text-gray-500 mt-1">
          macOS requires explicit permissions for the agent to control your machine
        </p>
      </div>

      <div className="space-y-3">
        <PermissionCard
          title="Screen Recording"
          description="Required to capture your screen for live streaming and screenshots"
          status={permissions?.screenRecording || 'unknown'}
        />

        <div
          className={`p-4  rounded-xl flex items-center justify-between transition-colors ${
            permissions?.accessibility
              ? ' bg-gradient-to-b from-[#0ee000] to-[#076a00]'
              : ' bg-gradient-to-t  from-[#8F101B] to-[#DF303A] '
          }`}
        >
          <div>
            <h3 className="font-semibold text-lg">Accessibility</h3>
            <p className="text-sm text-gray-400">
              Required for mouse and keyboard remote control
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!permissions?.accessibility && (
              <button
                onClick={requestAccessibility}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
              >
                Request
              </button>
            )}
            <span className="text-sm capitalize font-medium">
              {permissions?.accessibility ? 'granted' : 'denied'}
            </span>
            <div className={`w-3 h-3 rounded-full ${permissions?.accessibility ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>

        <div
          className={`p-4   rounded-xl flex items-center justify-between transition-colors ${
            permissions?.automation
              ? ' bg-gradient-to-b from-[#0ee000] to-[#076a00] '
              : ' bg-gradient-to-t  from-[#8F101B] to-[#DF303A]'
          }`}
        >
          <div>
            <h3 className="font-semibold text-lg">Automation</h3>
            <p className="text-sm text-gray-400">
              Required to launch apps and control system settings via AppleScript
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm capitalize font-medium">
              {permissions?.automation ? 'granted' : 'denied'}
            </span>
            <div className={`w-3 h-3 rounded-full ${permissions?.automation ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <p className="text-xs text-gray-500">
          💡 If a permission is denied, go to <strong>System Settings → Privacy & Security</strong> and enable the relevant permission for this app, then restart the agent.
        </p>
      </div>
    </div>
  );
}
