'use client';
 
import PairingCodeCard from '@/components/PairingCodeCard';

export default function PairingPage() {
  
  return (
    <div className="flex items-center max-w-4xl mx-auto justify-center min-h-screen   p-4">
      <div className="  space-y-8">
         
        <div className="text-center space-y-2 w-[560px] ">
          <div className="text-5xl mb-4 drop-shadow-xl drop-shadow-[#ffffff4f]  ">🔗</div>
          <h1 className="text-3xl font-bold text-white">Pair Your Device</h1>
          <p className="text-gray-400 text-sm">
            Share this code with your web dashboard to connect your Mac
          </p>
        </div>
  
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
