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
  user: string
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
    <motion.div initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        delay: 0.1,
        duration: 0.6,
      }}
      className="p-5 rounded-xl drop-shadow-2xl drop-shadow-[#4d4d4d] glass-panel  drop-shadow-2xl drop-shadow-[#0000006d] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg shadow-lg shadow-black/50 bg-gradient-to-br from-zinc-500/20 to-zinc-600/20 border border-white/[0.08] flex items-center justify-center text-4xl">
            💻
          </div>
          <div>
            <h3 className="font-semibold text-sm">{user}'s {hostname} </h3>
            <p className="text-xs text-gray-300">{platform} · {arch}</p>
          </div>
        </div>

        <StatusBadge status={isConnected ? 'online' : 'offline'} label={isConnected ? 'Connected to Server' : 'Disconnected'} />

      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl !shadow-2xl glass-panel-dark shadow-white/[0.02]">
          <p className="text-[10px] text-gray-200 uppercase tracking-wider mb-1">CPUs</p>
          <p className="text-sm font-medium">{cpus} cores</p>
        </div>
        <div className="p-3 rounded-2xl !shadow-2xl glass-panel-dark shadow-white/[0.02]">
          <p className="text-[10px] text-gray-200 uppercase tracking-wider mb-1">Memory</p>
          <p className="text-sm font-medium">{formatBytes(freeMemory)} free</p>
          <p className="text-[10px] text-gray-200">of {formatBytes(totalMemory)}</p>
        </div>
        <div className="p-3 rounded-2xl !shadow-2xl glass-panel-dark shadow-white/[0.02]">
          <p className="text-[10px] text-gray-200 uppercase tracking-wider mb-1">Uptime</p>
          <p className="text-sm font-medium">{formatUptime(uptime)}</p>
        </div>
      </div>
    </motion.div>
  );
}
