import type { Metadata } from "next";
import "./globals.css";
import WebRTCManager from "@/components/WebRTCManager";
import UpdateBanner from "@/components/UpdateBanner";
import Navigation from "@/components/Navigation";
 

export const metadata: Metadata = {
  title: "MAC in AIR",
  description: "Remote desktop control agent for macOS",
};
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={` relative  `}>

         
        <Navigation />
        
        <WebRTCManager />
        {/* <UpdateBanner /> */}
        <div className="flex mt-5 6   text-white ">
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
     
      </body>
    </html>
  );
}
