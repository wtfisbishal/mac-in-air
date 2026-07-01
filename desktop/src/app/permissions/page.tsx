'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion'
export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<any>(null);

  const loadPermissions = async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const perms = await window.electronAPI.getAllPermissions();

      console.log(perms)
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
  const requestRec = async () => {
    if (window.electronAPI) {
      await window.electronAPI.requestRecoading();
      await loadPermissions();

    }
  };

  if( permissions?.screenRecording === 'granted' && permissions?.accessibility   && permissions?.automation  ) {
    return null;
  }

  return (
    <div className="  space-y-6   mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Permissions</h1>
        <p className="text-sm text-gray-500 mt-1">
          macOS requires explicit permissions for the agent to control your machine
        </p>
      </div>

      <div className="space-y-3">
        
        <motion.div initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.1,
            duration: 0.6,
          }} className={`p-4   rounded-2xl flex items-center justify-between transition-colors ${permissions?.screenRecording === 'granted' ? 
          ' border border-[#12e5037a] bg-[#05490066] ' 
          : '  bg-red-500/10 border border-red-500/30 '}`}>
          <div>
            <h3 className="font-semibold text-lg">Screen Recording</h3>
            <p className="text-sm text-gray-200">Required to capture your screen for live streaming and screenshots</p>
          </div>
          <div className="flex items-center gap-2">
             { permissions?.screenRecording !== 'granted' && (
              <button
                onClick={requestRec}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
              >
                Request
              </button>
            )}

            <span className="text-sm capitalize font-medium">{permissions?.screenRecording}</span>
            <div className={`w-3 h-3 rounded-full ${permissions?.screenRecording === 'granted' ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </motion.div>

        <motion.div initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.1,
            duration: 0.6,
          }}
          className={`p-4  rounded-2xl flex items-center justify-between transition-colors ${permissions?.accessibility
            ? ' border border-[#12e5037a] bg-[#05490066] '
            : '   bg-red-500/10 border border-red-500/30 '
            }`}
        >
          <div>
            <h3 className="font-semibold text-lg">Accessibility</h3>
            <p className="text-sm text-gray-200">
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
        </motion.div>

        <motion.div initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.1,
            duration: 0.6,
          }}
          className={`p-4   rounded-2xl flex items-center justify-between transition-colors ${permissions?.automation
            ? '   border border-[#12e5037a] bg-[#05490066] '
            : '   bg-red-500/10 border border-red-500/30 '
            }`}
        >
          <div>
            <h3 className="font-semibold text-lg">Automation</h3>
            <p className="text-sm text-gray-200">
              Required to launch apps and control system settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm capitalize font-medium">
              {permissions?.automation ? 'granted' : 'denied'}
            </span>
            <div className={`w-3 h-3 rounded-full ${permissions?.automation ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </motion.div>
      </div>

      <div className="p-4 rounded-3xl bg-black/20 border border-white/15">
        <p className="text-xs text-gray-300">
          💡 If a permission is denied, go to <strong>System Settings → Privacy & Security</strong> and enable the relevant permission for this app, then restart the agent.
        </p>
      </div>

      
    </div>
  );
}
