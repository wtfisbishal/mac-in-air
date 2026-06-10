'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/home', label: 'Home', icon: '📊' },
  { href: '/permissions', label: 'Permissions', icon: '🔐' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
  { href: '/setup', label: 'Setup', icon: '🚀' },
  { href: '/pairing', label: 'Pairing', icon: '🔗' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 !px-3 !pt-4 min-h-screen bg-[#0d0d0d] border-r border-white/[0.06] flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b  border-white/[0.06]">
        <div className="flex items-center gap-2">
          
          <span className="font-extrabold text-2xl text-white tracking-tight">MAC in AIR</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 !pt-7 !px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 !px-3 !py-2 !mt-2 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-white/[0.08] text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      
    </aside>
  );
}
