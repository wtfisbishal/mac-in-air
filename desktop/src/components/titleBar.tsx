'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function TitleBar() {
  const pathname = usePathname();

  const items = [
    { label: 'Home', href: '/home' },
    { label: 'Permissions', href: '/permissions' },
    { label: 'Pairing', href: '/pairing' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <div
      className="fixed top-0 left-0 z-50 h-14 w-full flex items-center justify-center backdrop-blur-3xl"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        className=" flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden p-1
        "
      >
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              className={` px-8 py-1.5 text-sm font-medium transition-all duration-200 rounded-full whitespace-nowrap
                ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:text-white'
                }
              `}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default TitleBar;