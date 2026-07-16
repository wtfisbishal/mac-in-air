import { StatusBadge } from './StatusBadge';
import { motion } from 'framer-motion'
interface DeviceCardProps {
  hostname: string;
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
  isConnected: boolean;
  user: string,
  display: {
    width: number,
    height: number,
    scaleFactor: number
  }

}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function DeviceCard({
  hostname,
  platform,
  arch,
  user,
  cpus,
  totalMemory,
  freeMemory,
  uptime,
  isConnected,

}: DeviceCardProps) {
  return (
    <motion.div initial={{ y: 30, opacity: 0, filter: 'blur(6px)' }}
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}

      transition={{
        delay: 0.1,
        duration: 0.6,
      }}
      className="p-5 rounded-xl drop-shadow-2xl drop-shadow-[#4d4d4d] glass-panel-card  drop-shadow-2xl drop-shadow-[#0000006d] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16  flex items-center justify-center text-4xl">
            <svg xmlns="http://www.w3.org/2000/svg" className=' drop-shadow-xl drop-shadow-[#ffffff44]' width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
              <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm">{user}'s {hostname} </h3>
            <p className="text-xs text-gray-300">{platform} · {arch}</p>
          </div>
        </div>

        <StatusBadge status={isConnected ? 'online' : 'offline'} label={isConnected ? 'ONLINE' : 'OFFLINE'} />

      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl glass-panel-car bg-[#00000063] border border-[#ffffff2f] backdrop-blur-2xl shadow-xl shadow-[#ffffff14] ">
          <p className="text-[10px] text-gray-200 uppercase tracking-wider mb-1">CPUs</p>
          <p className="text-sm font-medium">{cpus} cores</p>
        </div>
        <div className="p-3 rounded-2xl glass-panel-car bg-[#00000063] border border-[#ffffff2f] backdrop-blur-2xl shadow-xl shadow-[#ffffff14] ">
          <p className="text-[10px] text-gray-200 uppercase tracking-wider mb-1">Memory</p>
          <p className="text-sm font-medium">{formatBytes(freeMemory)} free</p>
          <p className="text-[10px] text-gray-200">of {formatBytes(totalMemory)}</p>
        </div>
        <div className="p-3 rounded-2xl glass-panel-car bg-[#00000063] border border-[#ffffff2f] backdrop-blur-2xl shadow-xl shadow-[#ffffff14]">
          <p className="text-[10px] text-gray-200 uppercase tracking-wider mb-1">Uptime</p>
          <p className="text-sm font-medium">{formatUptime(uptime)}</p>
        </div>


      </div>
    </motion.div>
  );
}
