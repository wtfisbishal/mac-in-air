import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import  TitleBar  from "@/components/titleBar";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MAC in WIND",
  description: "Remote desktop control agent for macOS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} relative   font-sans`}>

        <TitleBar />

        <div className="flex mt-16 app-container bg-[#191a1d] text-white">
           
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
 