import React from 'react';
import { motion } from 'framer-motion'
interface PermissionCardProps {
  title: string;
  description: string;
  status: string;
}

export function PermissionCard({ title, description, status }: PermissionCardProps) {
  const isGranted = status === 'granted';

  return (
    <motion.div initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        delay: 0.1,
        duration: 0.6,
      }} className={`p-4   rounded-2xl flex items-center justify-between transition-colors ${isGranted ? ' bg-gradient-to-b from-[#12e503bf] to-[#054900] ' : '  bg-gradient-to-t  from-[#8F101B] to-[#DF303A]'}`}>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-gray-200">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm capitalize font-medium">{status}</span>
        <div className={`w-3 h-3 rounded-full ${isGranted ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
    </motion.div>
  );
}
