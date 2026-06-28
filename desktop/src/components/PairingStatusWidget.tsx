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
      <div className="p-4 rounded-xl my-4 glass-panel -dark bg-gradient-to-  from-[#FFB600] to-[#C98500] transition-colors cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="text-xl">🔗</div>
          <div className="flex-1">
            <h3 className="font-semibold text-indigo-100 text">Pairing Required</h3>
         
            <p className="text-indigo-300 /60 text-xs mt-2">
              Click here to view your pairing code →
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
