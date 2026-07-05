'use client';
import { useState, useEffect } from 'react';
import {motion} from 'framer-motion';
import { useRouter } from 'next/navigation';
interface PairingCodeCardProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function PairingCodeCard({ onRefresh, isLoading = false }: PairingCodeCardProps) {
  const [pairingCode, setPairingCode] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const copyToClipboard = (e:any) => {
    e.preventDefault();
    navigator.clipboard.writeText(pairingCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleRefresh = async (e:any) => {
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
      // <div className=" glass-panel border flex flex-col h-[220px] items-center justify-center  border-gray-700 rounded-xl p-6 animate-pulse">

      //   <div className=' mt-3'>
      //     {Array.from({ length: 6 }).map((_, index) => (
      //       <span key={index} className='glass-panel-dark font-extrabold ml-2 text-transparent font-mono !text-5xl px-6 rounded-4xl p-5'>
      //         {index}
      //       </span>
      //     ))}
      //   </div> 
         
      // </div>
      null
    );
  }

  if (error && !pairingCode) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <p className="text-red-400">{error}</p>
        <button 

        className=' mt-5 mx-auto flex-1 glass-button disabled:bg-gray-600 disabled:opacity-50 text-white font-semibold py-2 px-4 !rounded-full '
        onClick={()=>{window.location.reload();}}>Refresh</button>
      </div>
    );
  }

  return (
    <motion.div
    initial={{   opacity: 0 ,filter: 'blur(6px)'}}
      animate={{   opacity: 1 ,filter: 'blur(0px)'}}

      transition={{
        delay: 0.1,
        duration: 0.6,
      }}
    className="space-y-4">

      <div className="relative group">
        <div
          className="
           bg-gradient-to-t from-[#1C0B53] to-[#503993]
            rounded-xl p-6 w-full   h-fit flex flex-col gap-3
            text-center cursor-pointer
          "
          onClick={copyToClipboard}
        >
          <p className="text-gray-300 text-xs mb-8 uppercase tracking-wider font-semibold">
            Pairing Code
          </p>

          <div>{
            pairingCode.split('').map((i) => (
              <span className=' bg-[#10062fab] shadow-xl shadow-[#10062f7d] font-extrabold  ml-2 text-white font-mono !text-5xl px-6 rounded-4xl p-5 '>
                {i}
              </span>
            ))
          }
          </div>
          <p className="text-gray-300 text-xs mt-7">Click to copy</p>
        </div>

        {copySuccess && (
          <div className="absolute w-full  text-3xl inset-0 rounded-xl bg-indigo-200/20 flex items-center justify-center text-green-400 font-semibold animate-pulse">

          </div>
        )}
      </div>

      <div className="flex gap-2 !mt-4 w-full ">
        <button
          onClick={copyToClipboard}
          disabled={isLoading || loading}
          className="
            flex-1 glass-button-primary disabled:bg-gray-600 disabled:opacity-50
            text-white font-semibold py-3 px-4 !rounded-full
            
          "
        >
          {copySuccess ? '✓ Copied' : 'Copy Code'}
        </button>
        <button
          onClick={handleRefresh}
          disabled={isLoading || loading}
          className="
            flex-1 glass-button disabled:bg-gray-600 disabled:opacity-50
            text-white font-semibold py-3 px-4 !rounded-full
             
          "
        >
          {loading ? '⟳ Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="text-xs w-full  text-gray-400 text-center">
        Code expires in 30 minutes
      </div>
    </motion.div>
  );
}
