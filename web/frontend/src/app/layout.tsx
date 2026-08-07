import type { Metadata } from 'next'; 
import './globals.css';
import Providers from '@/components/Providers';
 
export const metadata: Metadata = {
  title:'MAC in AIR'  ,
  description: 'Control your Mac remotely — screen streaming, mouse & keyboard control.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers> 
      </body>
    </html>
  );
}
