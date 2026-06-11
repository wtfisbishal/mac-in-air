"use client";

import { useState, useEffect, } from "react";
import Link from "next/link";
import MacKeyBoard from "@uiw/react-mac-keyboard";
import Image from "next/image";
import { Battery, Search, Wifi } from "lucide-react";

const features = [
  {
    icon: "🖱️",
    title: "Remote Mouse & Keyboard",
    desc: "Full pointer control and keyboard input. Type, click, scroll — every interaction your Mac supports, delivered through the browser.",
  },
  {
    icon: "📺",
    title: "Live Screen Streaming",
    desc: "Real-time screen mirroring with ultra-low latency. Watch your Mac desktop update live as you work from anywhere in the world.",
  },
  {
    icon: "🚀",
    title: "Launch Any App",
    desc: "Browse your full application library and open any app with one tap. No switching back — just click and it launches on your Mac.",
  },
  {
    icon: "🔐",
    title: "End-to-End Encrypted",
    desc: "Every session is secured with AES-256 encryption. Your screen and inputs never leave your private tunnel.",
  },
  {
    icon: "⌨️",
    title: "Full Keyboard Input",
    desc: "Type naturally with full modifier key support — ⌘, ⌥, ⌃, and Fn combos all work as expected.",
  },
  {
    icon: "⚡️",
    title: "Ultra-low Latency",
    desc: "WebRTC-powered streaming keeps latency under 30ms on a good connection — indistinguishable from local.",
  },
];

const macApps = [
  { name: "Finder", icon: "https://s3.macosicons.com/macosicons/icons/k9tFW4a3UM/lowResPngFile_9e80c50a5802d3b0a7ec66f3fe4ce348_low_res_Finder.png", },
  { name: "Safari", icon: "https://s3.macosicons.com/macosicons/icons/utug9Rt8g6/lowResPngFile_a0b8d534889b5695781a9a03f388e2d4_low_res_Safari__MacOS_Tahoe_.png", },
  { name: "Terminal", icon: "https://s3.macosicons.com/macosicons/icons/yqUGh6O6LH/lowResPngFile_1ae9bc6811dcc2d2d0e82816c3ee1727_low_res_Terminal__MacOS_Tahoe_.png", },
  { name: "Xcode", icon: "https://s3.macosicons.com/macosicons/icons/B7GcnoIhKy/lowResPngFile_53ef82cc954d2fed837f43ec890f93a6_low_res_Xcode__Liquid_Glass_.png", },
  { name: "Maps", icon: "https://s3.macosicons.com/macosicons/icons/5aA6m3BXxr/lowResPngFile_a3b2511cb67879107a0b6da86c3d1dc5_low_res_Maps__MacOS_Tahoe_.png", },
  { name: "Stocks", icon: "https://s3.macosicons.com/macosicons/icons/rI6kmZBrnK/lowResPngFile_da63fad3e36519f6e472618b55b62532_rI6kmZBrnK.png", },
  { name: "Activity Moniter", icon: "https://s3.macosicons.com/macosicons/icons/413ZGJDwjU/lowResPngFile_26997c9db4faff8c1098c0de56993a6b_low_res_Activite_monitor__MacOS_Tahoe_.png", },
  { name: "Figma", icon: "https://s3-new.macosicons.com/macosicons/parse/Figma_NgviovhviJ_lowResPng-f7b09e724a.png", },
  { name: "VS Code", icon: "https://s3-new.macosicons.com/macosicons/parse/VScode_tpG0bknPQ1_lowResPng-b77f4d22f5.png", },
  { name: "Spotify", icon: "https://s3.macosicons.com/macosicons/icons/tQBv6ezYwU/lowResPngFile_2966a8081bf2a5de2e69f29bb1915822_low_res_Spotify___Liquid_Glass__Dark_.png", },
  { name: "facetime", icon: "https://s3.macosicons.com/macosicons/icons/E0Ws4w1yiC/lowResPngFile_b04a7c53fd9f231f804bd3261bcb6430_low_res_Facetime.png", },
  { name: "Notion", icon: "https://s3.macosicons.com/macosicons/icons/uToySGMoFX/lowResPngFile_71c01a72158ca05f472b688d0dd4360f_low_res_Notion.png", },
];

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".scroll-fade-in");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export default function Home() {
  const [time, setTime] = useState("");
  useScrollReveal();

  useEffect(() => {
    const tick = () => {
      const now = new Date();

      const date = now.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      const time = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      setTime(`${date} ${time}`);
    };

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, []);


 
  return (
    <>


      <div className=" relative min-h-screen overflow-x-hidden">

        <div className="fixed top-0 left-0 w-full h-screen bg-[url('/walpaper.png') bg-[#0a0908  bg-gradient-to-t  from-[#0B0B12] to-[#111119]   bg-cover bg-center ">

        </div>
        {/* Menu Bar */}
        <nav className="  fixed top-0 !text-white bg-[#00000000] z-[100] backdrop-blur-2xl left-0 right-0  h-8 flex items-center justify-between px-5">
          <div className="flex items-center gap-5 text-[11px] font-medium  ">
            <span className="text-lg"></span>
            <span className="font-semibold">MAC in AIR</span>
            <span className=" hidden sm:inline">File</span>
            <span className=" hidden sm:inline">View</span>
            <span className=" hidden sm:inline">Window</span>
            <span className=" hidden sm:inline">Help</span>
          </div>
          <div className="flex justify-center items-center !gap-4 text-[13px] text-gray-100">
            <p className=" flex justify-center items-center !gap-4"><Battery size={15} /> <Wifi size={15} /> <Search size={15} />   </p>
            <p className="text-xs  tabular-nums">{time}</p>
          </div>
        </nav>




        {/* Hero  */}
        <section className="min-h-screen flex flex-col items-center justify-center pt-8 px-4 relative overflow-hidden">


          {/* Mac window mockup */}


          <img src="/logo.png" className="mt-20 mb-5 h-[100px]" alt="" />

          {/* Headline */}
          <div className="text-center z-10 px-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-gray-100 uppercase mb-4">
              Your Mac · Anywhere
            </p>
            <h1 className="text-6xl   sm:text-8xl font-black logo-text text-clip text-transparent  bg-clip-text tracking-tight leading-none mb-4"
              style={{ letterSpacing: "-0.03em" }}>
              <span className=" text-white pb-3 !mb-5">   </span> MAC in AIR
            </h1>
            <p className=" text- text-gray-100 font-light max-w-xl max-md:text-sm mx-auto mt-4 leading-relaxed">
              Full Mac control from any browser. Stream your screen, move the mouse,
              type, open apps — everything, from anywhere.
            </p>
          </div>



          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-10 z-10">
            <Link href="/home"
              className="glass-button-primary rounded-full px-7 py-3 text-[15px] font-semibold cursor-pointer">
              Open Dashboard
            </Link>
            <a href="#download"
              className="glass-button rounded-full px-7 py-3 text-[15px] font-semibold text-gray-700 cursor-pointer">
               Download for Mac
            </a>
          </div>

          {/* Version badge */}
          <div className="mt-6 z-10">
            <span className=" glass-panel-dark rounded-full px-3 py-1 text-[11px] text-gray-400 font-medium">
              macOS 13+ · Free during beta
            </span>
          </div>


          <div className=" mt-10   py-20  w-full">

            <MacKeyBoard
              className="w-fit drop-shadow-[#9b9b9b75] drop-shadow-2xl "
              
            />
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-28 px-4 sm:px-8 max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-fade-in">
            <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase mb-3">Capabilities</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-200 tracking-tight"
              style={{ letterSpacing: "-0.025em" }}>
              Everything your Mac can do.
              <br />
              <span className="text-gray-400 font-light">From your browser.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={f.title}
                className=" backdrop-blur-2xl drop-shadow-[#9b9b9b57] drop-shadow-2xl  glass-panel-dark cursor-pointer hover:scale-[1.01]  transition-all duration-500 rounded-4xl p-6 scroll-fade-in"
                style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-[15px] font-semibold text-gray-200 mb-2">{f.title}</h3>
                <p className="text-[13px] text-gray-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}


        <section className="py-20 px-4">

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14 scroll-fade-in">

              <p className="text-xs font-semibold tracking-[0.2em] text-gray-300 uppercase mb-3">Setup</p>
              <h2 className="text-4xl font-bold  tracking-tight" style={{ letterSpacing: "-0.025em" }}>
                Ready in three steps.
              </h2>

            </div>
            <div className="glass-panel-dark drop-shadow-[#9b9b9b57] drop-shadow-2xl rounded-4xl p-8 sm:p-12 relative overflow-hidden scroll-fade-in">
              <div className="flex absolute top-6 left-8 items-center gap-2 mb-5">
                <span className="traffic-light" style={{ background: "#FF5F57" }} />
                <span className="traffic-light" style={{ background: "#FFBD2E" }} />
                <span className="traffic-light" style={{ background: "#28C840" }} />

              </div>
              <div className="grid sm:grid-cols-3  mt-5 !text-white gap-8 relative z-10">
                {[
                  { step: "01", title: "Install the Mac app", desc: "Download the lightweight helper app and install it on your Mac in seconds." },
                  { step: "02", title: "Sign in on the web", desc: "Open MAC in AIR in any browser and log in with the same account." },
                  { step: "03", title: "Take control", desc: "Your Mac appears instantly. Stream, click, type — it's all yours remotely." },
                ].map((s) => (
                  <div key={s.step} className="flex flex-col gap-3">
                    <span className="text-[11px] font-bold tracking-[0.15em] text-gray-300">{s.step}</span>
                    <h3 className="text-[16px] font-semibold text-blue-400">{s.title}</h3>
                    <p className="text-[13px] text-gray-200 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* App Library */}
        <section className="py-20 px-4 sm:px-8 max-w-6xl mx-auto drop-shadow-[#9b9b9b75] drop-shadow-2xl ">
          <div className="text-center mb-12 scroll-fade-in">
            <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase mb-3">App Library</p>
            <h2 className="text-4xl font-bold text-gray-50 tracking-tight" style={{ letterSpacing: "-0.025em" }}>
              Every app on your Mac.{" "}
              <span className="text-gray-400 font-light">One click away.</span>
            </h2>
            <p className="text-[15px] text-gray-500 mt-3 max-w-md mx-auto">
              Browse and launch any installed app from the web dashboard. No switching — it opens on your Mac instantly.
            </p>
          </div>


          <div className="glass-panel-dark rounded-4xl p-6 scroll-fade-in">
            {/* Window chrome */}
            <div className="flex items-center gap-2 mb-5">
              <span className="traffic-light" style={{ background: "#FF5F57" }} />
              <span className="traffic-light" style={{ background: "#FFBD2E" }} />
              <span className="traffic-light" style={{ background: "#28C840" }} />
              <span className="text-[12px] text-gray-400 ml-3 font-medium">Applications</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-0">
              {macApps.map((app) => (
                <div key={app.name} className="rounded-3xl p-3 flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-2xl shadow-sm">

                    <img src={app.icon} alt={app.name} loading="lazy" height={50} width={50} className=" w-full h-full object-fit" />
                  </div>
                  <span className="text-[10px] text-gray-200 font-medium text-center leading-tight">{app.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4   flex items-center justify-between">
              <span className="text-[12px] text-gray-400">Showing 12 of 84 apps</span>
              <Link href="/home" className="text-[12px] font-semibold cursor-pointer" style={{ color: "#0A84FF" }}>
                View all →
              </Link>
            </div>
          </div>
        </section>

      
        <section className=" w-[70%] max-md:w-[95%]  shadow-[#f7f7f7]  shadow-xl my-20 mt-32 glass-panel-dark overflow-hidden relative mx-auto rounded-4xl flex justify-between flex-col h-[600px] bg-gradient-to-t  from-[#0E161B] to-[#252f35]  ">

          <div className="w-[70%] max-md:w-full max-md:px-8 max-md:ml-0  ml-[10%] flex flex-col  items-start justify-center  mt-20">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-200 mb-3 tracking-tight"
              style={{ letterSpacing: "-0.025em" }}>
              Download the Mac App
            </h2>
            <p className="text-gray-300 text-[13px] max-md:text-xs  mb-8 leading-relaxed">
              Install the helper app on your Mac and you're ready to connect
              from any web browser in seconds. No configuration needed.
            </p>

            <div className=" hidden max-md:flex max-md:w-full  flex-col w-[40%]  items-start  justify-center  mb-20 gap-3">
              <button
                className="glass-button-primary rounded-full px-8 py-3  text-[15px] font-semibold flex items-center gap-2 cursor-pointer">
                 Download for Mac
              </button>

              <p className="text-[10px] text-gray-400 ml-6">macOS 13 Ventura or later</p>
            </div>
 
          </div>

          <div className=" w-full flex mb-32  justify-start  ">

            <div className="flex max-md:hidden flex-col w-[40%]  items-center justify-center  mb-20 gap-3">
              <button
                className="glass-button-primary rounded-full px-8 py-3 text-[15px] font-semibold flex items-center gap-2 cursor-pointer">
                 Download for Mac
              </button>

              <p className="text-[10px] text-gray-400">macOS 13 Ventura or later</p>
            </div>

            <div className=" w-[60%] max-md:w-[95%] border-black shadow-[black] shadow-2xl outline-2 outline-[#ffffff7b] rounded-[22px] border-[12px] overflow-hidden 
             transition-all duration-500 hover:-rotate-1 hover:scale-105 border h-[400px] max-md:h-[300px] hover:-right-8   -right-12 -bottom-8 absolute ">

              <div className=" h-[23px] w-[100px] flex items-center justify-center bg-black absolute -top-1 left-[45%] z-10 rounded-lg -2xl">
                <div className=" h-1 w-1 bg-green-500 ml-10 rounded-full"></div>
              </div>
              <Image
                src="/desk.png"
                alt="Desktop"
                fill
                className="object-cover object-top-left rounded -xl  !w-full !h-[400px] "
              />
            </div>

          </div>

        </section>



        <div className="w-full h-[30vh] max-md:h-[10vh] relative overflow-hidden">

          <h1 className=" last-text bg-clip-text text-transparent text-[160px] max-md:text-6xl max-md:-bottom-[20%] absolute -bottom-[40%] w-full text-center  font-extrabold  tracking-wide">
            MAC in AIR
          </h1>
        </div>


      </div>
    </>
  );
}
