"use client";

import { useState, useEffect, } from "react";
import Link from "next/link";
import Image from "next/image";
import { Battery, Search, Wifi } from "lucide-react";
import { features, macApps, useScrollReveal } from "@/lib/utils";
import { MacbookScroll } from "@/components/ui/macbook-scroll";
import MacKeyboard from "@/components/ui/MacbookKeyboard";
import MagicMouse from "@/components/ui/MagicMouse";


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

  const handleDownload = async () => {
    window.open("/api/download", "_self");
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`xattr -cr "/Applications/MAC in AIR.app"`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className=" relative min-h-screen overflow-x-hidden">

        <div className=" overflow-hidden b order mac-bg-gradient">
          <MacbookScroll
            src={`/sec2.png`}
          />
        </div>

        <div></div>

        {/* Menu Bar */}

        <nav className="  fixed top-0 !text-white bg-[#111119] z-[100] backdrop-blur-[4px] left-0 right-0  h-8 flex items-center justify-between max-md:px-3 px-5">
          <div className="flex items-center gap-5 text-[11px] max-md:gap-2 font-medium  ">
            <span className="text-lg"> <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
              <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
            </svg></span>
            <span className="font-semibold">MAC in AIR</span>
            <span className=" hidden sm:inline">File</span>
            <span className=" hidden sm:inline">View</span>
            <span className=" hidden sm:inline">Window</span>
            <span className=" hidden sm:inline">Help</span>
          </div>
          <div className="flex justify-center items-center max-md:gap-2  gap-4 text-[13px] text-gray-100">
            <p className=" flex justify-center items-center max-md:gap-3 gap-4"><Battery size={15} /> <Wifi size={15} /> <Search size={15} />   </p>
            <p className="text-xs  tabular-nums">{time}</p>
          </div>
        </nav>

        {/* Hero  */}
        <section className="min-h-screen   ! z-[100]! flex flex-col items-center justify-center pt-8 px-4 relative overflow-hidden">

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-16 z-10">
            <Link href="/home"
              className="glass-button-primary rounded-full px-7 py-3 text-[15px] font-semibold cursor-pointer">
              Open Dashboard
            </Link>
            <button onClick={() => handleDownload()}
              className="glass-button flex items-center justify-center gap-1 rounded-full px-7 py-3 text-[15px] font-semibold text-gray-700 cursor-pointer">

              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
                <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
              </svg>

              Download for Mac
            </button>
          </div>

          <div className=" mt-10  py-20  w-full">
            <p className="text-xs font-semibold tracking-[0.2em] text-center text-gray-400 uppercase mb-3">Control fully Keyboard and Mouse </p>

            <div className="w-full flex max-md:flex-row-reverse max-md:justify-end items-center   justify-center">
              <MacKeyboard />
              <MagicMouse className={' drop-shadow-[0_5px_10px_#ffffff57]'} />
            </div>

          </div>
        </section>


        {/* video sections  */}

        <section className="h-screen pt-20 max-md:min-h-fit flex flex-col justify-between w-full fle x flex-">
          <div>
            <p className="text-center font-semibold mb-3 text-gray-300 uppercase mb-3 tracking-[0.2em] " >Demos</p>
            <h2 className="text-4xl text-center logo1 sm:text-5xl font-bold text-gray-200  ">
              Control end to end
              <br />
              <span className="text-gray-400 text-3xl font-light">With Secure Environment.</span>
            </h2>
          </div>
          <DemoVideoSection />
        </section>

        {/*   Features   */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  ">
            {features.map((f, i) => (
              <div key={f.title}
                className={` ${f.className || ''} backdrop-blur-2xl border-[#ffffff35] cursor-pointer hover:scale-[1.01]  transition-all duration-500  p-6 scroll-fade-in`}
                style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-[15px] font-semibold text-gray-200 mb-2">{f.title}</h3>
                <p className="text-[13px] text-gray-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}


        <section className="py-20 px-4  z-10 relative   ">

          <div className=" w-[70%] max-md:w-[97%] mx-auto">
            <div className="text-center mb-14 scroll-fade-in">

              <p className="text-xs font-semibold tracking-[0.2em] text-gray-300 uppercase mb-3">Setup</p>
              <h2 className="text-4xl font-bold  tracking-tight" style={{ letterSpacing: "-0.025em" }}>
                Ready in
                <span className="text-clip bg-clip-text text-transparent bg-gradient-to-t from-[#5d43ab] to-[#a88df9] text-8xl "> 3 </span> steps.
              </h2>

            </div>
            <div className="glass-panel-dark drop-shadow-[#9b9b9b57] drop-shadow-2xl rounded-4xl p-6 sm:p-12 relative overflow-hidden scroll-fade-in">
              <div className="flex absolute top-6 left-8 max-md:left-5 items-center gap-2 mb-5">
                <span className="traffic-light" style={{ background: "#FF5F57" }} />
                <span className="traffic-light" style={{ background: "#FFBD2E" }} />
                <span className="traffic-light" style={{ background: "#28C840" }} />

              </div>
              <div className="grid sm:grid-cols-3  mt-5 !text-white gap-8 relative z-10">
                {[
                  {
                    step: "01",
                    title: "Install the Mac App",
                    desc: "Download the Mac app and complete the sign-in just a few seconds.",
                    additional: ' xattr -cr "/Applications/MAC in AIR.app" '
                  },
                  {
                    step: "02",
                    title: "Sign In on the Web",
                    desc: "Open MAC in AIR in your preferred browser and sign in."
                  },
                  {
                    step: "03",
                    title: "Take Control",
                    desc: "Once the devices are paired, you can stream your Mac, click, type, and control it remotely from anywhere."
                  }
                ].map((s) => (
                  <div key={s.step} className="flex flex-col gap-3">
                    <span className="text-[28px] font-bold tracking-[0.15em] text-gray-300">{s.step}</span>
                    <p className="text-[16px] font-semibold text-blue-500">{s.title}</p>
                    <p className="text-[13px] text-gray-200 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 space-y-4">
                <h1 className="text-2xl font-bold text-blue-500">
                  How Install on macOS
                </h1>

                <ol className="list-decimal space-y-2 pl-5 text-gray-300">
                  <li>Download the Applications If macOS blocks the application from opening.</li>
                  <li>Open Terminal.</li>
                  <li>Paste the command below and press Enter.</li>
                  <li>Launch the app normally.</li>
                </ol>
              </div>
              <div className="relative  mt-10 shadow-xl shadow-[#0000005f] rounded-2xl w-full overflow-hidden">
                {/* Terminal Header */}
                <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 border-b border-zinc-700">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>

                  <button
                    onClick={(e) => handleCopy()}
                    className="text-xs text-zinc-300 hover:text-white px-2 py-1 rounded bg-zinc-800"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <pre className="bg-black text-green-400 p-4 overflow-x-auto font-mono text-sm min-h-[120px]">
                  <code> xattr -cr "/Applications/MAC in AIR.app" </code>
                </pre>
              </div>

            </div>
          </div>
        </section>




        <section className="flex  relative flex-col max-md:h-[60vh] h-screen justify-center items-center stream-s-g radient text-[#2a2a4a] bg-[#e4dfff]">


          <div className="stream-s-gradient absolute w-[200%] h-[49%] -top-40  b order border-black " />

          <div className="stream-e-gradient absolute w-[200%] h-[67%]  b order border-black -bottom-32 max-md:-bottom-36 "></div>

          <div className="text-center max-md:-mt-14 scroll-fade-in">

            <p className="text-xs font-semibold tracking-[0.2em] text-[#2a2a4a] uppercase mb-3">Streaming</p>

            <div className="text-4xl font-bold text-[#8b5cf6] tracking-tight" style={{ letterSpacing: "-0.025em" }}>
              <h2> Go live instantly.{" "}</h2>
              <p className="text- text-[#2a2a4a] font-light"> Secure peer-to-peer connection </p>
            </div>

            <p className="text-[15px] text-gray-500 mt-3 max-w-md mx-auto">
              Stream in smooth, high-quality video at up to 60 FPS.
            </p>
          </div>

          <div className="w-full relative max-md:px-[9%] mx-auto mt-7 flex justify-center items-center">

            <div className="w-[130px] max-md:w-[50px] absolute h-7 max-md:h-3 top-3 max-md:top-1 max-md:left-[43%] left-[47%] flex justify-center items-center max-md:rounded rounded-md z-10 bg-black   ">
              <div className=" h-1 w-1 bg-green-500  rounded-full"></div>
            </div>


            <div className="border-[18px] max-md:border-[8px] rounded-t-2xl max-md:rounded-t-xl border-[#070707] ">
              <Image loading="eager" className=" z-[2] w-[900px] max-md:w-full stream-img-shadow     " src="/stream.png" alt="" height={400} width={1000} />

              <div className=" bg-[#303030] amber-50 h-5 max-md:h-3" />

            </div>

            <div className=" w-full px-2   absolute flex items-center justify-center left-0   max-md:-bottom-2 -bottom-5">

              <div className="w-[1050px] max-md:w-[480px]  relative h-7 max-md:h-3.5     flex justify-center  shadow-[inset_0px_-12px_11px_-2px_#000000a1,0px_12px_41px_12px_#00000080] max-md:rounded-b-md  rounded-b-xl z-10 bg-[#7C7C7C]  ">
                <div className="w-[180px] max-md:w-[80px] bg-[#5e5e5e] h-4  max-md:h-2 shadow-[inset_3px_3px_6px_0_#000000a1]  rounded-b-2xl" />

                {/* //grip pad */}
                <div className="absolute -bottom-2 max-md:-bottom-1 w-20 max-md:w-10 bg-[#5e5e5e] h-2 max-md:h-1 rounded-b-3xl left-[7%] shadow-[inset_3px_3px_6px_0_#000000a1] " />
                <div className="absolute -bottom-2 max-md:-bottom-1 w-20 max-md:w-10 bg-[#5e5e5e] h-2 max-md:h-1 rounded-b-3xl right-[7%] shadow-[inset_3px_3px_6px_0_#000000a1] " />
              </div>
            </div>

          </div>
        </section>



        {/* Apps */}
        <section className="py-20 px-4 sm:px-8 max-w-6xl mx-auto  ">
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
            {/* Windows */}
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

        <SecuritySections />

        <section className=" w-[70%] max-md:w-[95%]  shadow-[#f7f7f7]  shadow-xl my-20 mt-32 glass-panel-dark overflow-hidden relative mx-auto rounded-4xl flex justify-between flex-col h-[600px]    ">

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
              <button onClick={() => handleDownload()}
                className="glass-button-primary rounded-full px-8 py-3  text-[15px] font-semibold flex items-center gap-2 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
                  <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
                </svg> Download for Mac
              </button>

              <p className="text-[10px] text-gray-400 ml-6">macOS 13 Ventura or later</p>
            </div>

          </div>

          <div className=" w-full flex mb-32  justify-start  ">

            <div className="flex max-md:hidden flex-col w-[40%]  items-center justify-center  mb-20 gap-3">
              <button onClick={() => handleDownload()}
                className="glass-button-primary rounded-full px-8 py-3 text-[15px] font-semibold flex items-center gap-2 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
                  <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
                </svg>
                Download for Mac
              </button>

              <p className="text-[10px] text-gray-400">macOS 13 Ventura or later</p>
            </div>

            <div className=" w-[60%] max-md:w-[95%] border-black shadow-[black] shadow-2xl outline-2 outline-[#ffffff82] rounded-[22px] border-[12px] overflow-hidden 
             transition-all duration-500 hover:-rotate-1 hover:scale-105 border h-[400px] max-md:h-[300px] hover:-right-8   -right-12 -bottom-8 absolute ">

              <div className=" h-[23px] w-[100px] flex items-center justify-center bg-black absolute -top-1.5 left-[45%] z-10 rounded-lg -2xl">
                <div className=" h-1 w-1 bg-green-500 ml-10 rounded-full"></div>
              </div>
              <Image
                src="/desk.png"
                alt="Desktop"
                fill loading="lazy"
                className="object-cover object-top-left rounded -xl  !w-full !h-[400px] "
              />
            </div>
          </div>
        </section>


        <div className="w-full h-[30vh] max-md:h-[10vh] relative overflow-hidden">

          <h1 className=" last-text bg-clip-text text-transparent text-[170px] max-md:text-6xl max-md:-bottom-[20%] absolute -bottom-[30%] w-full text-center  font-extrabold  tracking-wide">
            MAC in AIR
          </h1>
        </div>


      </div>
    </>
  );
}

const DemoVideoSection = () => {
  return (
    <div className=" w-full h-[80%] max-md:mt-20 max-md:min-h-screen    max-md:flex-col max-md:gap-5  items-center">

     <div className=" flex  max-md:flex-col">
       <div className="  flex flex-col items-center justify-center gap-10 max-md:gap-4  h-full w-[40%] max-md:w-full px-5">
        <div> 
          <h1 className="logo1 font-bold text-5xl max-md:text-4xl">In your phone . </h1>
        </div>

        <div className="relative h-115 w-65 max-md:h-[502px] max-md:w-[265px]  border-[5px] border-[#ffffff4f] rounded-4xl">
          <div className=" absolute top-4 w-25 rounded-full left-18.75 max-md:left-[79px] bg-black h-7" /> 
        </div>
      </div>
      <div className=" flex flex-col items-center justify-center gap-10 max-md:gap-4 h-full w-[60%] max-md:w-full  max-md:pt-16 px-5 ">
        <div>
          {/* <p>Demo</p> */}
          <h1 className="logo1 font-bold text-5xl  max-md:text-4xl">In another Pc . </h1>
        </div>

        <div className="relative  w-[750px] h-[400px] max-md:h-[232px] max-md:w-full [243px] border-[5px] border-[#ffffff4f] rounded-4xl">
          <div className=" absolute -top- w-[150px] max-md:w-[120px] rounded-xl left-2/5 max-md:left-[33%] bg-black h-10" /> 

        </div>
      </div>
     </div>

    </div>
  )
}



const SecuritySections = () => {
  return (
    <section className="py-28 px-4 sm:px-8 relative overflow-hidden">

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-20 scroll-fade-in logo1">
          <p className="text-sm font-semibold tracking-[0.2em] text-gray-400 uppercase mb-3">Security</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Encrypted end-to-end.
            <br />
            <span className="text-gray-400 max-md:text-xl  font-light">Your stream never touches our servers.</span>
          </h2>
        </div>


        <div className="scroll-fade-in">
          {/*   Browser  */}
          <div className="flex items-center">

            {/*  Browser mockup  */}
            <div className="flex-shrink-0 w-[250px] max-md:w-[120px]">
              <div className="rounded-xl max-md:rounded-md overflow-hidden border border-white/10 bg-[#141420] shadow-2xl shadow-black/50">
                {/* browser chrome bar */}
                <div className="bg-[#1e1e2e22] px-2 py-0.5 max-md:px-0 flex items-center gap-1">
                  <div className="flex gap-1 max-md:hidden">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/70" />
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/70" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
                  </div>
                  <div className=" bg-[#0d0d18b3]  w-fit rounded-full px-2  flex items-center gap-1.5 text-[8px max-md: text-[5px] text-emerald-400">
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    macinair.bishal.online
                  </div>
                </div>
                <Image className=" w-full" height={100} width={200} src="/stream.png" alt="" loading="lazy" />
              </div>
              <p className="text-center text-[10px] text-gray-500 mt-2">Your Browser</p>
            </div>

            {/*  Encrypted Tunnel  */}
            <div className="flex-1 relative mx-3 max-md:mx-1" style={{ height: 4 }}>
              {/* glow line */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/50 via-emerald-400 to-emerald-500/50" />
              <div className="absolute inset-0 rounded-full blur-sm bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />


              {[0, 0.7, 1.4].map((d) => (
                <div key={`lr${d}`} style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#4ade80', boxShadow: '0 0 8px #4ade80',
                  animation: `pkt-lr 2.2s linear ${d}s infinite`,
                }} />
              ))}

              {[0.4, 1.1].map((d) => (
                <div key={`rl${d}`} style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#818cf8', boxShadow: '0 0 8px #818cf8',
                  animation: `pkt-rl 2.2s linear ${d}s infinite`,
                }} />
              ))}


              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 40, height: 40, borderRadius: '50%',
                background: '#031a0e',
                border: '2px solid #22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'lock-glow 2.4s ease-in-out infinite',
                zIndex: 10,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              {/* label above tunnel */}
              <div style={{ position: 'absolute', bottom: 25, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
                className="text-[10px] text-emerald-400 font-mono">
                WebRTC DTLS-SRTP
              </div>
            </div>

            {/* macbook mockup */}
            <div className="flex-shrink-0 w-[250px]  relative max-md:w-[120px]">

              <div className="w-[50px]  absolute h-4 max-md:h-3 top-0 max-md:left-[25%] left-[40%] flex justify-center items-center rounded z-10 bg-black   ">
                <div className=" h-0.5 w-0.5 bg-green-500  rounded-full"></div>
              </div>


              <div className="rounded-t-xl max-md:rounded-md overflow-hidden border-8 max-md:border-4 border-black /10 bg-[#141420] shadow-2xl shadow-black/50">
                <div className=" ">
                  <Image height={200} width={200} className="w-full h-full" src="/sec2.png" alt="" loading="lazy" />

                </div>

                <div className="w-[290px] absolute h-3 max-md:h-2 -left-5 max-md:-left-3 flex justify-center  shadow-[inset_0px_-12px_11px_-2px_#000000a1] rounded-b-md z-10 bg-[#7C7C7C] max-md:w-[140px] ">
                  <div className="w-[100px] max-md:w-[40px] bg-[#5e5e5e] h-2  max-md:h-1 shadow-[inset_3px_3px_6px_0_#000000a1]  rounded-b-2xl" />
                </div>
              </div>
              <p className="text-center text-[10px] text-gray-500 mt-2 ">Your Windows PC</p>
            </div>
          </div>

          {/* Server: bypassed */}
          <div className="flex flex-col items-center mt-3">
            {/* dashed vertical line */}
            <div style={{ width: 1, height: 28, borderLeft: '1.5px dashed rgba(100,116,139,0.3)' }} />
            {/* server card */}
            <div style={{ animation: 'float-srv 3.5s ease-in-out infinite' }}
              className="flex items-center gap-3 border border-red-500/[0.4] bg-red-500/10 [] rounded-3xl px-5 py-3">
              <div className="opacity-40">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fb2c36" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-red-500/70">Backend server</p>
                <p className="text-[10px] text-red-600/60">Signaling only — never sees your stream or keystrokes</p>
              </div>
              <div className="ml-1 text-[9px] font-mono bg-red-900/20 border border-red-700/40 rounded-lg px-2 py-1 text-red-500/50 whitespace-nowrap">
                No content
              </div>
            </div>
            <p className="text-[11px] text-red-500 mt-2">Stream travels peer-to-peer · server is bypassed</p>
          </div>

          {/* Legend */}
          <div className="mt-10 flex flex-wrap justify-center gap-3 text-[11px]">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              Live stream — WebRTC DTLS-SRTP
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 6px #818cf8' }} />
              Pairing — HMAC-SHA256 (in-browser)
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-slate-500">
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#475569' }} />
              Signaling only — no data
            </span>
          </div>

        </div>
      </div>
    </section>
  )
}

