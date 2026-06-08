'use client';

import { useState } from 'react';
import PairingCodeCard from '@/components/PairingCodeCard';

export default function SettingsPage() {
  const [deviceName, setDeviceName] = useState('My MacBook');
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real implementation, you'd persist these via electron-store or similar
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your desktop agent</p>
      </div>

      <div className="space-y-5">
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Device Name</label>
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
            placeholder="My MacBook"
          />
          <p className="text-xs text-gray-600">A friendly name for this device</p>
        </div>

        
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div>
            <h3 className="text-sm font-medium">Auto Launch on Startup</h3>
            <p className="text-xs text-gray-500 mt-0.5">Start the agent when you log in</p>
          </div>
          <button
            onClick={() => setAutoLaunch(!autoLaunch)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              autoLaunch ? 'bg-blue-500' : 'bg-white/[0.1]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                autoLaunch ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
      >
        {saved ? '✓ Saved' : 'Save Settings'}
      </button>

      
    </div>
  );
}
