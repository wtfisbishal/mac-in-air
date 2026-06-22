'use client';

import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import AppLayout from '@/components/AppLayout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NormalKeyboard from '@/app/(private)/control/_components/NormalKeyboard';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toasts, dismiss } = useToast();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <AppLayout>
      <div className="p-7  max-md:w-full  w-[70%]  mx-auto">
        <div className="mb-7 animate-fade-up">
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        </div>

        <div className="space-y-5 animate-fade-up delay-1">

          <div className="glass-panel-card rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={15} className="text-indigo-400" />
              <p className="text-sm font-semibold text-white">Account</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 border border-indigo-500/10">
                {user?.email?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{user?.email ?? '—'}</p>
                <p className="text-xs text-slate-500">Logged in</p>
              </div>
            </div>
              <button
              onClick={handleLogout}
              className="w-full flex  mt-5 items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>

          


          <div className="px-5 pt-6 !pb-5">
            <Link href="/home" className="flex flex-col items-center gap-3 group">

              <div className='  '>
                <img src="/logo.png" height={90} width={90} className='drop-shadow-[#f6f6f63b] drop-shadow-2xl  object-fit' alt="" />

              </div>
              <div className="leading-none">
                <p className="text-xl font-bold text-white tracking-tight">MAC in AIR</p>
              </div>
            </Link>
          </div>

        </div>



        {/* <NormalKeyboard /> */}

        <App/> 
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </AppLayout>
  );
}
 
function App() {
  const [playKey, setPlayKey] = useState(0);
 
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-neutral-950 py-10">
      {/* Phone frame */}
      <div className="relative h-[640px] w-[320px] overflow-hidden rounded-[42px] border-[6px] border-neutral-800 bg-black shadow-2xl">
        <div className="absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-black" />
        <ConnectingScreen key={playKey} deviceName="iPhone 15 Plus" />
      </div>
 
      <button
        onClick={() => setPlayKey((k) => k + 1)}
        className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
      >
        Replay animation
      </button>
    </div>
  );
}
 

 
interface ConnectingScreenProps {
  /** Small label above the device name, e.g. "Connecting to" */
  label?: string;
  /** Bold headline, e.g. "iPhone 15 Plus" */
  deviceName: string;
  /** Extra classes for the outer container (set a height if you don't want h-full) */
  className?: string;
}

/**
 * Recreation of the iOS-style "Connecting to <device>" screen:
 * a soft animated mesh-gradient backdrop with a short metallic
 * intro swirl that dissolves into the colour blobs, plus a
 * fade/rise-in text reveal and a slow "breathing" pulse on the
 * headline while the connection is in progress.
 *
 * Usage:
 *   <div className="h-screen w-screen">
 *     <ConnectingScreen deviceName="iPhone 15 Plus" />
 *   </div>
 */
  function ConnectingScreen({
  label = "Connecting to",
  deviceName,
  className = "",
}: ConnectingScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const introTimer = setTimeout(() => setIntroDone(true), 850);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(introTimer);
    };
  }, []);

  return (
    <div
      className={`relative isolate flex h-full w-full items-center justify-center overflow-hidden bg-[#020912] ${className}`}
    >
      {/* ---- Mesh-gradient backdrop ---- */}
      <div className="absolute inset-0">
        <span className="blob blob-a" />
        <span className="blob blob-b" />
        <span className="blob blob-c" />
        <span className="blob blob-d" />
      </div>

      {/* ---- Metallic intro swirl, dissolves away ---- */}
      <div
        aria-hidden
        className={`absolute inset-0 intro-swirl transition-opacity duration-700 ease-out ${
          introDone ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* ---- Film-grain texture for a frosted, premium feel ---- */}
      <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay grain" />

      {/* ---- Vignette so text stays legible ---- */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />

      {/* ---- Text ---- */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center">
        <p
          className={`mb-1.5 text-[15px] font-medium text-white/70 transition-all duration-700 ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
          }`}
        >
          {label}
        </p>
        <h1
          className={`breathe text-[28px] font-semibold tracking-tight text-white transition-all delay-150 duration-700 ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-2.5 opacity-0"
          }`}
        >
          {deviceName}
        </h1>
      </div>

      <style>{`
        .blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(48px);
          will-change: transform;
        }
        .blob-a {
          width: 75%;
          height: 60%;
          top: -18%;
          right: -20%;
          background: radial-gradient(circle at 30% 30%, #4d7bdb, #1c3f9c 70%);
          animation: float-a 16s ease-in-out infinite;
        }
        .blob-b {
          width: 85%;
          height: 65%;
          left: -25%;
          top: 28%;
          background: radial-gradient(circle at 60% 40%, #2fa6a3, #0f6d72 70%);
          animation: float-b 18s ease-in-out infinite;
        }
        .blob-c {
          width: 90%;
          height: 55%;
          left: -10%;
          bottom: -25%;
          background: radial-gradient(circle at 50% 50%, #123a78, #050d2e 75%);
          animation: float-c 20s ease-in-out infinite;
        }
        .blob-d {
          width: 60%;
          height: 40%;
          right: -15%;
          bottom: -15%;
          background: radial-gradient(circle, #1f51b8, transparent 70%);
          opacity: 0.8;
          animation: float-d 15s ease-in-out infinite;
        }

        @keyframes float-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-4%, 4%) scale(1.06); }
        }
        @keyframes float-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3%, -3%) scale(1.04); }
        }
        @keyframes float-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-3%, -2%) scale(1.05); }
        }
        @keyframes float-d {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(4%, 3%) scale(0.95); }
        }

        .breathe {
          animation: breathe 2.6s ease-in-out infinite;
          animation-delay: 1.1s;
        }
        @keyframes breathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .intro-swirl {
          background: conic-gradient(from 0deg at 40% 35%, #0a1024, #6f8fe0, #0a1024 35%, #1a2550 55%, #aab8e8 70%, #0a1024 85%, #0a1024);
          animation: swirl-spin 1.4s ease-out;
          transform-origin: 50% 50%;
        }
        @keyframes swirl-spin {
          from { transform: scale(1.6) rotate(-25deg); }
          to { transform: scale(1.15) rotate(0deg); }
        }

        .grain {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
          background-size: 160px 160px;
        }

        @media (prefers-reduced-motion: reduce) {
          .blob, .breathe, .intro-swirl {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}


interface ConnectingTextOverlayProps {
  /** Small label above the title, e.g. "Connecting to" */
  label?: string;
  /** Bold headline, e.g. "iPhone 15 Plus" */
  title: string;
  className?: string;
}
 
/**
 * Just the text reveal from the reference video: a small label and a bold
 * title that slide up from below and fade in, with the title trailing the
 * label slightly. Has no background of its own — stack it over whatever
 * backdrop you want (image, video, gradient, etc).
 *
 * Usage:
 *   <div className="relative h-screen w-screen">
 *     <YourBackground />
 *     <div className="absolute inset-0 flex items-center justify-center">
 *       <ConnectingTextOverlay label="Connecting to" title="iPhone 15 Plus" />
 *     </div>
 *   </div>
 */
 function ConnectingTextOverlay({
  label = "Connecting to",
  title,
  className = "",
}: ConnectingTextOverlayProps) {
  const [mounted, setMounted] = useState(false);
 
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);
 
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <p
        className={`mb-1.5 text-[15px] font-medium text-white/70 transition-all duration-700 ease-out motion-reduce:transition-none ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {label}
      </p>
      <h1
        className={`text-[28px] font-semibold tracking-tight text-white transition-all delay-150 duration-700 ease-out motion-reduce:transition-none ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
        }`}
      >
        {title}
      </h1>
    </div>
  );
}
 