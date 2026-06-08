'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function PairingStatusWidget() {
  const [isPaired, setIsPaired] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPairingStatus = async () => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        try {
          const code = await window.electronAPI.getPairingCode();
          setIsPaired(!code);
        } catch (err) {
          setIsPaired(true);
        } finally {
          setLoading(false);
        }
      }
    };

    checkPairingStatus();
  }, []);

  if (loading) {
    return null;
  }

  if (isPaired) {
    return null;  
  }

  return (
    <Link href="/pairing">
      <div className="p-4 rounded-xl my-4 bg-gradient-to-b from-[#FFB600] to-[#C98500] transition-colors cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="text-xl">🔗</div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-100 text">Pairing Required</h3>
            <p className="text-yellow-200 /70 text-xs mt-1">
              Share your pairing code to connect this device to the web dashboard
            </p>
            <p className="text-yellow-300 /60 text-xs mt-2">
              Click here to view your pairing code →
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
