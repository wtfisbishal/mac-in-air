'use client';

import { useEffect, useState } from 'react';
import PairingCodeCard from '@/components/PairingCodeCard';

export default function PairingPage() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        try {
          const info = await window.electronAPI.getDeviceInfo();
          setDeviceInfo(info);
        } catch (err) {
          console.error('Failed to load device info');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen  ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4">
          </div>
          <p className="text-gray-400">Loading device info...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen   p-4">
      <div className="max-w-md w-full space-y-8">
         
        <div className="text-center space-y-2 w-[560px] ">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-3xl font-bold text-white">Pair Your Device</h1>
          <p className="text-gray-400 text-sm">
            Share this code with your web dashboard to connect your Mac
          </p>
        </div>
 
        {deviceInfo && (
          <div className="bg-gradient-to-t w-[560px] h-[160px] from-[#0E161B] to-[#374750]  rounded-lg p-4 ">
            <p className="text-gray-400 text-xs mb-2 uppercase font-semibold">Device</p>
            <p className="text-white font-semibold font-mono capitalize"> 💻 {deviceInfo.user}'s {deviceInfo.hostname}</p>
            <p className="text-gray-500 text-sm">{deviceInfo.platform} • {deviceInfo.arch}</p>
            <p className="text-gray-600 text-xs mt-2">{deviceInfo.cpus} CPUs • {(deviceInfo.totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB RAM</p>
          </div>
        )}
 
        <PairingCodeCard />

         
        <div className="bg-blue-500/10 border w-[560px]  border-blue-500/30 rounded-lg p-4 space-y-3">
          <p className="text-blue-300 font-semibold text-sm">How to pair:</p>
          <ol className="text-blue-200/80 text-sm space-y-2">
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold flex-shrink-0">1</span>
              <span>Open web dashboard</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold flex-shrink-0">2</span>
              <span>Click "Add Device"</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold flex-shrink-0">3</span>
              <span>Enter the 6-digit code</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold flex-shrink-0">4</span>
              <span>Done! Control your Mac</span>
            </li>
          </ol>
        </div> 
         
        <p className="text-center text-gray-500 text-xs">
          Your device info stays secure and is only used for pairing
        </p>
      </div>
    </div>
  );
}
