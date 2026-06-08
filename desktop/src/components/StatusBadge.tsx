interface StatusBadgeProps {
  status: 'online' | 'offline' | 'connecting';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = {
    online: { color: 'bg-green-500', glow: 'shadow-[0_0_8px_rgba(34,197,94,0.5)]', text: 'Online' },
    offline: { color: 'bg-red-500', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.5)]', text: 'Offline' },
    connecting: { color: 'bg-yellow-500', glow: 'shadow-[0_0_8px_rgba(234,179,8,0.5)]', text: 'Connecting' },
  };

  const { color, glow, text } = config[status];

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
      <div className={`w-2 h-2 rounded-full ${color} ${glow} animate-pulse`} />
      <span className="text-xs font-medium text-gray-300">{label || text}</span>
    </div>
  );
}
