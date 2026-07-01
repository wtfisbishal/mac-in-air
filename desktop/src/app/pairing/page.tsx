'use client';
 
import PairingCodeCard from '@/components/PairingCodeCard';

export default function PairingPage() {
  
  return (
    <div className="flex items-center max-w-4xl mx-auto justify-center mt-3   p-4">
      <div className="  space-y-8">
         
        <div className="text-center space-y-2 w-[560px] ">
          <div className="text-5xl mb-4 drop-shadow-xl drop-shadow-[#ffffff4f]  ">🔗</div>
          <h1 className="text-3xl font-bold text-white">Pair Your Device</h1>
          <p className="text-gray-400 text-sm">
            Share this code with your web dashboard to connect your Mac
          </p>
        </div>
  
        <PairingCodeCard /> 
          
        <p className="text-center text-gray-500 text-xs">
          Your device info stays secure and is only used for pairing
        </p>
      </div>
    </div>
  );
}
