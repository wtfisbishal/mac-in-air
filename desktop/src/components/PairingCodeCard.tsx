'use client';
import { useState, useEffect } from 'react';

interface PairingCodeCardProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function PairingCodeCard({ onRefresh, isLoading = false }: PairingCodeCardProps) {
  const [pairingCode, setPairingCode] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCode = async () => {
      if (typeof window === 'undefined' || !window.electronAPI) {
        setError('Electron API not available');
        setLoading(false);
        return;
      }
      const MAX_RETRIES = 5;
      const RETRY_DELAY_MS = 800;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const code = await window.electronAPI.getPairingCode();
          // console.log(`[PairingCodeCard] attempt ${attempt} → code:`, code);
          if (code) {
            setPairingCode(code);
            setError('');
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('[PairingCodeCard] getPairingCode error:', err);
        }

        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      }

      // All retries exhausted
      setError('Could not retrieve pairing code. Make sure the app is connected.');
      setLoading(false);
    };

    fetchCode();
  }, []);

  const copyToClipboard = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(pairingCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleRefresh = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const code = await window.electronAPI.refreshPairingCode();
      if (code) {
        setPairingCode(code);
        setError('');
      } else {
        setError('Failed to refresh code');
      }
    } catch (err) {
      setError('Failed to refresh pairing code');
    } finally {
      setLoading(false);
      onRefresh?.();
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-12 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error && !pairingCode) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <div className="relative group">
        <div
          className="
           bg-gradient-to-t from-[#1C0B53] to-[#503993]
            rounded-xl p-6 w-[560px]  h-fit flex flex-col gap-3
            text-center cursor-pointer
          "
          onClick={copyToClipboard}
        >
          <p className="text-gray-300 text-xs mb-8 uppercase tracking-wider font-semibold">
            Pairing Code
          </p>

          <div>{
            pairingCode.split('').map((i) => (
              <span className=' bg-[#10062fab]  font-extrabold  ml-2 text-white font-mono !text-5xl px-6 rounded-4xl p-5 '>
                {i}
              </span>
            ))
          }
          </div>
          <p className="text-gray-300 text-xs mt-7">Click to copy</p>
        </div>

        {copySuccess && (
          <div className="absolute w-[560px]  text-3xl inset-0 rounded-xl bg-indigo-200/20 flex items-center justify-center text-green-400 font-semibold animate-pulse">

          </div>
        )}
      </div>

      <div className="flex gap-2 !mt-4 w-[560px] ">
        <button
          onClick={copyToClipboard}
          disabled={isLoading || loading}
          className="
            flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50
            text-white font-semibold py-2 px-4 rounded-lg
            transition-colors text-sm
          "
        >
          {copySuccess ? '✓ Copied' : 'Copy Code'}
        </button>
        <button
          onClick={handleRefresh}
          disabled={isLoading || loading}
          className="
            flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:opacity-50
            text-white font-semibold py-2 px-4 rounded-lg
            transition-colors text-sm
          "
        >
          {loading ? '⟳ Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="text-xs w-[560px]  text-gray-400 text-center">
        Code expires in 15 minutes
      </div>
    </div>
  );
}
