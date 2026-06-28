import type { Metadata } from "next";
import "./globals.css";
import TitleBar from "@/components/titleBar";
import WebRTCManager from "@/components/WebRTCManager";
import UpdateBanner from "@/components/UpdateBanner";
 

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
      <body className={` relative backdrop-blur-3xl bg-[#00000032]   font-sans`}>

         
        <TitleBar />
        <WebRTCManager />
        {/* <UpdateBanner /> */}
        <div className="flex mt-16   text-white ">
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
     
      </body>
    </html>
  );
}
