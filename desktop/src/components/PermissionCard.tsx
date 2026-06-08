import React from 'react';

interface PermissionCardProps {
  title: string;
  description: string;
  status: string;
}

export function PermissionCard({ title, description, status }: PermissionCardProps) {
  const isGranted = status === 'granted';

  return (
    <div className={`p-4   rounded-xl flex items-center justify-between transition-colors ${isGranted ? ' bg-gradient-to-b from-[#0ee000] to-[#076a00] ' : '  bg-gradient-to-t  from-[#8F101B] to-[#DF303A]'}`}>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm capitalize font-medium">{status}</span>
        <div className={`w-3 h-3 rounded-full ${isGranted ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
    </div>
  );
}
