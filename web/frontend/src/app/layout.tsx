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





        <script
  id="Nexora-widget"
  src="https://nexora.bishal.online/widget.js"
  data-server-url="https://nexora.bishal.online"
  data-site-id="Vishal B_web_collection1784485690997"
  data-unique-id="cmrs4pkks0001lg043t5gnnae"
  data-welcome-message="Hello! How can I assist you today?"
  data-header-title="MAC in AIR"
  data-button-label="Ask in AIR"
  data-button-color="#1a40ff"
  data-button-text-color="#ffffff"
  data-button-position="right"
  data-button-border-radius="14"
  data-window-width="400"
  data-window-height="500"
  data-primary-color="#1a40ff"
  data-theme="dark"
></script>
      </body>
    </html>
  );
}
