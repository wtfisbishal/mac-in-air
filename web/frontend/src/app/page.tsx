"use client";

import { useState, useEffect, } from "react";
import Link from "next/link";
import MacKeyBoard from "@uiw/react-mac-keyboard";
import Image from "next/image";
import { Battery, Search, Wifi } from "lucide-react";
import { features, macApps, useScrollReveal } from "@/lib/utils";
import { MacbookScroll } from "@/components/ui/macbook-scroll";


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

        <div className=" bg- mac-bg-gradient">
          <MacbookScroll
            src={`/bg2.webp`} 
          />
        </div>


        {/* Menu Bar */}

        <nav className="  fixed top-0 !text-white bg-[#111119] z-[100] backdrop-blur-[4px] left-0 right-0  h-8 flex items-center justify-between max-md:px-3 px-5">
          <div className="flex items-center gap-5 text-[11px] max-md:gap-2 font-medium  ">
            <span className="text-lg"></span>
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
        <section className="min-h-screen  flex flex-col items-center justify-center pt-8 px-4 relative overflow-hidden">

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-16 z-10">
            <Link href="/home"
              className="glass-button-primary rounded-full px-7 py-3 text-[15px] font-semibold cursor-pointer">
              Open Dashboard
            </Link>
            <button onClick={() => handleDownload()}
              className="glass-button rounded-full px-7 py-3 text-[15px] font-semibold text-gray-700 cursor-pointer">
               Download for Mac
            </button>
          </div>

          <div className=" mt-10  py-20  w-full">
            <p className="text-xs font-semibold tracking-[0.2em] text-center text-gray-400 uppercase mb-3">Control fully Keyboard and Mouse </p>
            <MacKeyBoard
              className="w-fit  drop-shadow-[#9b9b9b75] drop-shadow-2xl "
            />
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


        <section className="py-20 px-4  z-10 relative   ">

          <div className=" w-[80%] max-md:w-[97%] mx-auto">
            <div className="text-center mb-14 scroll-fade-in">

              <p className="text-xs font-semibold tracking-[0.2em] text-gray-300 uppercase mb-3">Setup</p>
              <h2 className="text-4xl font-bold  tracking-tight" style={{ letterSpacing: "-0.025em" }}>
                Ready in
                <span className="text-clip bg-clip-text text-transparent bg-gradient-to-t from-[#5d43ab] to-[#a88df9] text-8xl "> 4 </span> steps.
              </h2>

            </div>
            <div className="glass-panel-dark drop-shadow-[#9b9b9b57] drop-shadow-2xl rounded-4xl p-6 sm:p-12 relative overflow-hidden scroll-fade-in">
              <div className="flex absolute top-6 left-8 max-md:left-5 items-center gap-2 mb-5">
                <span className="traffic-light" style={{ background: "#FF5F57" }} />
                <span className="traffic-light" style={{ background: "#FFBD2E" }} />
                <span className="traffic-light" style={{ background: "#28C840" }} />

              </div>
              <div className="grid sm:grid-cols-4  mt-5 !text-white gap-8 relative z-10">
                {[
                  {
                    step: "01",
                    title: "Install the Mac App",
                    desc: "Download the lightweight Mac app and complete the installation in just a few seconds.",
                    additional: ' xattr -cr "/Applications/MAC in AIR.app" '
                  },
                  {
                    step: "02",
                    title: "Sign In on the Web",
                    desc: "Open MAC in AIR in your preferred browser and sign in."
                  },
                  {
                    step: "03",
                    title: "Pair Your Device",
                    desc: "Open the Pair section in the Mac app, copy the pairing code, and enter it on the web application."
                  },
                  {
                    step: "04",
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
          

          <div className="stream-s-gradient absolute w-[200%] h-[49%] -top-40  b order border-black ">
          </div>
          <div className="stream-e-gradient absolute w-[200%] h-[67%]  b order border-black -bottom-32 max-md:-bottom-36 "></div>

          <div className="text-center max-md:-mt-14 scroll-fade-in">

            <p className="text-xs font-semibold tracking-[0.2em] text-[#2a2a4a] uppercase mb-3">Streaming</p>

            <div className="text-4xl font-bold text-[#8b5cf6] tracking-tight"style={{ letterSpacing: "-0.025em" }}>
              <h2> Go live instantly.{" "}</h2>
              <p className="text- text-[#2a2a4a] font-light"> Secure peer-to-peer connection </p>
            </div>

            <p className="text-[15px] text-gray-500 mt-3 max-w-md mx-auto">
              Stream in smooth, high-quality video at up to 60 FPS.
            </p>
          </div>

          <div className="w-full max-md:w-[90%] mx-auto mt-7 flex justify-center items-center">
            <Image loading="eager" className=" z-[2]  stream-img-shadow rounded-4xl max-md:rounded-3xl animate-spotlight  " src="/stream.webp" alt="" height={400} width={1000} />
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
                 Download for Mac
              </button>

              <p className="text-[10px] text-gray-400 ml-6">macOS 13 Ventura or later</p>
            </div>

          </div>

          <div className=" w-full flex mb-32  justify-start  ">

            <div className="flex max-md:hidden flex-col w-[40%]  items-center justify-center  mb-20 gap-3">
              <button onClick={() => handleDownload()}
                className="glass-button-primary rounded-full px-8 py-3 text-[15px] font-semibold flex items-center gap-2 cursor-pointer">
                 Download for Mac
              </button>

              <p className="text-[10px] text-gray-400">macOS 13 Ventura or later</p>
            </div>

            <div className=" w-[60%] max-md:w-[95%] border-black shadow-[black] shadow-2xl outline-2 outline-[#ffffff82] rounded-[22px] border-[12px] overflow-hidden 
             transition-all duration-500 hover:-rotate-1 hover:scale-105 border h-[400px] max-md:h-[300px] hover:-right-8   -right-12 -bottom-8 absolute ">

              <div className=" h-[23px] w-[100px] flex items-center justify-center bg-black absolute -top-1.5 left-[45%] z-10 rounded-lg -2xl">
                <div className=" h-1 w-1 bg-green-500 ml-10 rounded-full"></div>
              </div>
              <Image
                src="/desk.webp"
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
    <div className=" w-full h-[80%] max-md:mt-20 max-md:min-h-screen flex justify-center  max-md:flex-col max-md:gap-5  items-center">

      <div className=" flex flex-col items-center justify-center gap-10 max-md:gap-4  h-full w-[40%] max-md:w-full px-5">
        <div>
          {/* <p>Demo</p> */}
          <h1 className="logo1 font-bold text-5xl max-md:text-4xl">In your phone . </h1>
        </div>

        <div className=" h-[600px] w-[290px] max-md:h-[502px] max-md:w-[243px]  border-[5px] border-[#ffffff4f] rounded-4xl">

        </div>
      </div>
      <div className=" flex flex-col items-center justify-center gap-10 max-md:gap-4 h-full w-[60%] max-md:w-full max-md:border-t max-md:border-x-0 max-md:pt-16  border-x border-[#ffffff4f] px-5 ">
        <div>
          {/* <p>Demo</p> */}
          <h1 className="logo1 font-bold text-5xl  max-md:text-4xl">In another Pc . </h1>
        </div>

        <div className="  w-[750px] h-[400px] max-md:h-[232px] max-md:w-full [243px] border-[5px] border-[#ffffff4f] rounded-4xl">

        </div>
      </div>

    </div>
  )
}