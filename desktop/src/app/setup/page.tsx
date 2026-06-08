'use client';

import { useEffect, useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';

export default function SetupPage() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const load = async () => {
        const info = await window.electronAPI.getDeviceInfo();
        setDeviceInfo(info);
        const connected = await window.electronAPI.getConnectionStatus();
        setIsConnected(connected);
        const perms = await window.electronAPI.getAllPermissions();
        setPermissions(perms);
      };
      load();
    }
  }, []);

  const steps = [
    {
      title: 'Device Detected',
      description: deviceInfo ? `${deviceInfo.hostname} (${deviceInfo.platform} ${deviceInfo.arch})` : 'Loading...',
      done: !!deviceInfo,
    },
    {
      title: 'Connection to Server',
      description: isConnected ? 'Connected to server' : 'Not connected Please try again later',
      done: isConnected,
    },
    {
      title: 'Screen Recording',
      description: permissions?.screenRecording === 'granted' ? 'Granted' : 'Required for screen capture',
      done: permissions?.screenRecording === 'granted',
    },
    {
      title: 'Accessibility',
      description: permissions?.accessibility ? 'Granted' : 'Required for mouse & keyboard control',
      done: !!permissions?.accessibility,
    },
    {
      title: 'Automation',
      description: permissions?.automation ? 'Granted' : 'Required for AppleScript commands',
      done: !!permissions?.automation,
    },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="text-4xl mb-4">🚀</div>
        <h1 className="text-2xl font-bold tracking-tight">Setup Your Mac</h1>

      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
              step.done
                ? 'bg-green-500/[0.04] border-green-500/20'
                : 'bg-white/[0.02] border-white/[0.06]'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              step.done ? 'bg-green-500/20 text-green-400' : 'bg-white/[0.06] text-gray-500'
            }`}>
              {step.done ? '✓' : i + 1}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{step.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <StatusBadge status={steps.every((s) => s.done) ? 'online' : 'connecting'} label={steps.every((s) => s.done) ? 'All Good!' : 'Setup Incomplete'} />
      </div>
    </div>
  );
}
