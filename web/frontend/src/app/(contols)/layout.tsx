import type { Metadata } from 'next';
 
export const metadata: Metadata = {
  title: 'MAC in AIR | Control',
  description: 'Control your Mac remotely — screen streaming, mouse & keyboard control.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative w-full">
          {children}
    </main>

  );
}
