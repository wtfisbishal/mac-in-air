import type { Metadata } from 'next';
 
import Navigation from '@/components/navigation';

export const metadata: Metadata = {
  title: { default: 'MAC in WIND', template: '%s | MAC in WIND' },
  description: 'Control your Mac remotely — screen streaming, mouse & keyboard control.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <div className="relative w-full">
        <Navigation />
        <div className="mt-[80px]  ">
          {children}
        </div>
      </div>
    </main>

  );
}
