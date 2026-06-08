import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'MAC in WIND', template: '%s | MAC in WIND' },
  description: 'Control your Mac remotely — screen streaming, mouse & keyboard control.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
