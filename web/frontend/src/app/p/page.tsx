
"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────
   Liquid Glass Orb – ambient background blobs
───────────────────────────────────────────── */
function LiquidOrb({
  size,
  color,
  style,
}: {
  size: number;
  color: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: color,
        filter: "blur(80px)",
        opacity: 0.35,
        ...style,
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Mac Window Frame
───────────────────────────────────────────── */
function MacWindow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(32px) saturate(1.8)",
        WebkitBackdropFilter: "blur(32px) saturate(1.8)",
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          background: "rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-[0_0_6px_#FF5F5788]" />
        <span className="w-3 h-3 rounded-full bg-[#FEBC2E] shadow-[0_0_6px_#FEBC2E88]" />
        <span className="w-3 h-3 rounded-full bg-[#28C840] shadow-[0_0_6px_#28C84088]" />
        <span
          className="ml-4 text-xs font-medium tracking-wide"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
           MAC in AIR — Remote Desktop
        </span>
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Animated Screen Preview
───────────────────────────────────────────── */
function ScreenPreview() {
  const [cursor, setCursor] = useState({ x: 60, y: 55 });
  const [typing, setTyping] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullText = "open -a Safari";
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Animate cursor
    const moveCursor = () => {
      setCursor({
        x: 30 + Math.random() * 45,
        y: 20 + Math.random() * 60,
      });
    };
    const cursorInterval = setInterval(moveCursor, 2200);

    // Animate typing
    const startTyping = () => {
      setTyping(true);
      setTypedText("");
      let i = 0;
      timerRef.current = setInterval(() => {
        if (i < fullText.length) {
          setTypedText(fullText.slice(0, i + 1));
          i++;
        } else {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => {
            setTypedText("");
            setTyping(false);
          }, 1600);
        }
      }, 90);
    };
    const typeInterval = setInterval(startTyping, 4500);
    return () => {
      clearInterval(cursorInterval);
      clearInterval(typeInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const apps = [
    { name: "Finder", emoji: "🗂" },
    { name: "Safari", emoji: "🧭" },
    { name: "Terminal", emoji: "⬛" },
    { name: "VS Code", emoji: "💙" },
    { name: "Slack", emoji: "💬" },
    { name: "Spotify", emoji: "🎵" },
    { name: "Figma", emoji: "🎨" },
  ];

  return (
    <MacWindow>
      <div
        className="relative overflow-hidden"
        style={{
          width: "100%",
          height: 340,
          background:
            "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        }}
      >
        {/* Fake desktop wallpaper gradient blobs */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 30%, rgba(94,106,210,0.4) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(124,131,247,0.3) 0%, transparent 50%)",
          }}
        />

        {/* Fake desktop icons */}
        <div className="absolute top-4 right-4 flex flex-col gap-3">
          {["📁", "🖥", "📝"].map((ic, i) => (
            <div key={i} className="flex flex-col items-center gap-1 w-14">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                {ic}
              </div>
              <span className="text-white text-[9px] opacity-70">File {i + 1}</span>
            </div>
          ))}
        </div>

        {/* Terminal window */}
        <div
          className="absolute top-6 left-6 rounded-xl overflow-hidden shadow-2xl"
          style={{
            width: 240,
            background: "rgba(0,0,0,0.75)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            className="flex items-center gap-1.5 px-3 py-2"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <span className="w-2 h-2 rounded-full bg-[#FF5F57]" />
            <span className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
            <span className="w-2 h-2 rounded-full bg-[#28C840]" />
            <span className="ml-2 text-[10px] text-white/40">zsh</span>
          </div>
          <div className="p-3 font-mono text-[11px] text-green-400 space-y-1">
            <div>
              <span className="text-blue-400">user@mac</span>
              <span className="text-white/60"> ~ % </span>
              <span className="text-white">ls -la</span>
            </div>
            <div className="text-white/50">Documents Desktop Downloads</div>
            <div>
              <span className="text-blue-400">user@mac</span>
              <span className="text-white/60"> ~ % </span>
              <span className="text-white">{typedText}</span>
              {typing && (
                <span className="animate-pulse text-white">▋</span>
              )}
            </div>
          </div>
        </div>

        {/* Animated cursor */}
        <div
          className="absolute pointer-events-none transition-all duration-[1800ms] ease-in-out"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            zIndex: 20,
          }}
        >
          <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
            <path
              d="M0 0L0 17L4.5 13L7 20L9 19L6.5 12L12 12L0 0Z"
              fill="white"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Dock */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-1 px-3 py-2 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(20px)",
          }}
        >
          {apps.map((app) => (
            <div
              key={app.name}
              className="group flex flex-col items-center"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-transform duration-150 hover:scale-125 hover:-translate-y-2 cursor-pointer"
                style={{ background: "rgba(255,255,255,0.1)" }}
                title={app.name}
              >
                {app.emoji}
              </div>
            </div>
          ))}
        </div>

        {/* Remote badge */}
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: "rgba(94,106,210,0.4)",
            border: "1px solid rgba(124,131,247,0.5)",
            backdropFilter: "blur(12px)",
            color: "#a8b0ff",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live · 24ms latency
        </div>
      </div>
    </MacWindow>
  );
}

/* ─────────────────────────────────────────────
   Glass Feature Card
───────────────────────────────────────────── */
function GlassCard({
  icon,
  title,
  desc,
  delay = 0,
}: {
  icon: string;
  title: string;
  desc: string;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="rounded-2xl p-6 transition-all duration-700"
      style={{
        background: "rgba(255,255,255,0.055)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(24px) saturate(1.6)",
        WebkitBackdropFilter: "blur(24px) saturate(1.6)",
        transitionDelay: `${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
      }}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="font-semibold text-white text-base mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
        {desc}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Dock Button
───────────────────────────────────────────── */
function DockBtn({
  emoji,
  label,
  href,
}: {
  emoji: string;
  label: string;
  href: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all duration-200"
        style={{
          background: hovered
            ? "rgba(94,106,210,0.35)"
            : "rgba(255,255,255,0.1)",
          border: hovered
            ? "1px solid rgba(124,131,247,0.6)"
            : "1px solid rgba(255,255,255,0.12)",
          transform: hovered ? "scale(1.2) translateY(-6px)" : "scale(1)",
          boxShadow: hovered
            ? "0 12px 32px rgba(94,106,210,0.4)"
            : "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {emoji}
      </div>
      <span
        className="text-[10px] font-medium tracking-wide transition-opacity duration-200"
        style={{
          color: "rgba(255,255,255,0.55)",
          opacity: hovered ? 1 : 0.6,
        }}
      >
        {label}
      </span>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Marquee strip
───────────────────────────────────────────── */
function Marquee() {
  const items = [
    "🖥 Screen Streaming",
    "🖱 Mouse Control",
    "⌨️ Keyboard Input",
    "📂 File Access",
    "🚀 App Launcher",
    "🔒 Encrypted Tunnel",
    "⚡️ Ultra-low Latency",
    "🌐 Browser-native",
  ];
  return (
    <div
      className="w-full overflow-hidden py-4"
      style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div
        className="flex gap-12 whitespace-nowrap animate-marquee"
        style={{ animationDuration: "22s" }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const features = [
    {
      icon: "🖥",
      title: "Live Screen Streaming",
      desc: "See your Mac's display in real time directly in your browser — smooth, full-color, and always in sync.",
    },
    {
      icon: "🖱",
      title: "Precision Mouse Control",
      desc: "Click, drag, scroll, and right-click anywhere on your Mac from any device, anywhere in the world.",
    },
    {
      icon: "⌨️",
      title: "Full Keyboard Input",
      desc: "Type naturally with full modifier key support — ⌘, ⌥, ⌃, and Fn combos all work as expected.",
    },
    {
      icon: "🚀",
      title: "App Launcher",
      desc: "Browse and open every app installed on your Mac directly from the web dashboard with one click.",
    },
    {
      icon: "🔒",
      title: "Encrypted Tunnel",
      desc: "End-to-end encrypted connection ensures your session is private — no proxy, no recording.",
    },
    {
      icon: "⚡️",
      title: "Ultra-low Latency",
      desc: "WebRTC-powered streaming keeps latency under 30ms on a good connection — indistinguishable from local.",
    },
  ];

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{
        background: "#07070F",
        color: "white",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      }}
    >
      {/* ── Inject keyframe animations ── */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 22s linear infinite;
        }
        @keyframes floatA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-50px, 25px) scale(1.08); }
          70% { transform: translate(30px, -15px) scale(0.95); }
        }
        @keyframes floatC {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 40px) scale(1.06); }
        }
        .orb-a { animation: floatA 12s ease-in-out infinite; }
        .orb-b { animation: floatB 16s ease-in-out infinite; }
        .orb-c { animation: floatC 10s ease-in-out infinite; }
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(36px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-in { animation: heroIn 0.9s cubic-bezier(.22,1,.36,1) forwards; }
        .hero-in-1 { animation-delay: 0.1s; opacity: 0; }
        .hero-in-2 { animation-delay: 0.28s; opacity: 0; }
        .hero-in-3 { animation-delay: 0.46s; opacity: 0; }
        .hero-in-4 { animation-delay: 0.64s; opacity: 0; }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(
            90deg,
            #7c83f7 0%,
            #c4c8ff 30%,
            #ffffff 50%,
            #c4c8ff 70%,
            #7c83f7 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.6; }
          70% { transform: scale(1.08); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        .pulse-ring {
          animation: pulse-ring 2.4s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
      `}</style>

      {/* ── Ambient liquid orbs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className="orb-a absolute"
          style={{
            width: 600,
            height: 600,
            top: "-10%",
            left: "-8%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(94,106,210,0.5) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="orb-b absolute"
          style={{
            width: 500,
            height: 500,
            top: "10%",
            right: "-5%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(180,120,255,0.4) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        <div
          className="orb-c absolute"
          style={{
            width: 700,
            height: 700,
            bottom: "5%",
            left: "20%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(40,200,180,0.2) 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />
      </div>

      {/* ── Noise texture overlay ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }}
      />

      {/* ── Navigation bar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-300"
        style={{
          background:
            scrollY > 40
              ? "rgba(7,7,15,0.75)"
              : "transparent",
          backdropFilter: scrollY > 40 ? "blur(20px) saturate(1.8)" : "none",
          borderBottom:
            scrollY > 40
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid transparent",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{
              background:
                "linear-gradient(135deg, #5E6AD2 0%, #7C83F7 100%)",
              boxShadow: "0 0 20px rgba(94,106,210,0.5)",
            }}
          >
            M
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">
            MAC <span style={{ color: "#7C83F7" }}>in WIND</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {["Features", "Apps", "Download", "Docs"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium transition-colors duration-200 hover:text-white"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {item}
            </a>
          ))}
        </div>
        <Link
          href="/home"
          className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background:
              "linear-gradient(135deg, #5E6AD2 0%, #8B91FF 100%)",
            boxShadow: "0 0 24px rgba(94,106,210,0.45)",
            color: "white",
          }}
        >
          Open Dashboard →
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-16 text-center"
        style={{ minHeight: "100svh" }}
      >
        {/* Live badge */}
        <div
          className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-10 text-xs font-semibold tracking-widest uppercase hero-in hero-in-1 ${loaded ? "hero-in" : ""}`}
          style={{
            background: "rgba(94,106,210,0.18)",
            border: "1px solid rgba(124,131,247,0.35)",
            backdropFilter: "blur(12px)",
            color: "#9ba5ff",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          Now Available · Browser-native Mac Control
        </div>

        {/* Main headline */}
        <h1
          className={`font-extrabold leading-[0.92] tracking-tighter hero-in hero-in-2 ${loaded ? "hero-in" : ""}`}
          style={{
            fontSize: "clamp(52px, 9vw, 130px)",
          }}
        >
          <span className="shimmer-text">MAC</span>
          <br />
          <span style={{ color: "rgba(255,255,255,0.92)" }}>in WIND</span>
        </h1>

        {/* Subheading */}
        <p
          className={`mt-7 max-w-xl text-lg leading-relaxed hero-in hero-in-3 ${loaded ? "hero-in" : ""}`}
          style={{ color: "rgba(255,255,255,0.48)", fontWeight: 400 }}
        >
          Your Mac — fully controlled from any browser, anywhere.
          Stream the screen, move the mouse, type, launch apps, and manage
          files without installing a thing.
        </p>

        {/* CTA row */}
        <div
          className={`flex flex-wrap items-center justify-center gap-4 mt-12 hero-in hero-in-4 ${loaded ? "hero-in" : ""}`}
        >
          <Link
            href="/home"
            className="group relative flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #5E6AD2 0%, #8B91FF 60%, #A78BFA 100%)",
              boxShadow:
                "0 0 40px rgba(94,106,210,0.6), 0 0 0 1px rgba(255,255,255,0.12) inset",
              color: "white",
            }}
          >
            <span>Go to Dashboard</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <a
            href="#download"
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(16px)",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download Mac App
          </a>
        </div>

        {/* Screen preview */}
        <div
          className={`w-full max-w-2xl mt-20 hero-in hero-in-4 ${loaded ? "hero-in" : ""}`}
          style={{
            filter: "drop-shadow(0 40px 80px rgba(94,106,210,0.35))",
          }}
        >
          <ScreenPreview />
        </div>
      </section>

      {/* ── Marquee ── */}
      <div className="relative z-10">
        <Marquee />
      </div>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 px-6 py-28 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "#7C83F7" }}
          >
            Everything you need
          </span>
          <h2
            className="mt-4 font-bold text-5xl tracking-tight"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Full Mac access.<br />Zero compromise.
          </h2>
          <p className="mt-5 text-base max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.42)" }}>
            Every feature you'd expect from a native remote desktop — running entirely in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <GlassCard
              key={i}
              icon={f.icon}
              title={f.title}
              desc={f.desc}
              delay={i * 80}
            />
          ))}
        </div>
      </section>

      {/* ── Apps Dock ── */}
      <section id="apps" className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-center">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "#7C83F7" }}
        >
          Browse & Launch
        </span>
        <h2
          className="mt-4 font-bold text-4xl tracking-tight mb-4"
          style={{ color: "rgba(255,255,255,0.92)" }}
        >
          Every app. One click away.
        </h2>
        <p
          className="text-base max-w-md mx-auto mb-14"
          style={{ color: "rgba(255,255,255,0.42)" }}
        >
           MAC in AIR maps all your installed applications to an in-browser launcher — browse, search, and open them remotely.
        </p>

        {/* Glass dock showcase */}
        <div
          className="flex flex-wrap items-end justify-center gap-5 px-8 py-6 rounded-3xl mx-auto max-w-xl"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(32px) saturate(1.8)",
          }}
        >
          {[
            { emoji: "🗂", label: "Finder", href: "/home" },
            { emoji: "🧭", label: "Safari", href: "/home" },
            { emoji: "⬛", label: "Terminal", href: "/home" },
            { emoji: "💙", label: "VS Code", href: "/home" },
            { emoji: "🎨", label: "Figma", href: "/home" },
            { emoji: "💬", label: "Slack", href: "/home" },
            { emoji: "🎵", label: "Spotify", href: "/home" },
            { emoji: "📸", label: "Photos", href: "/home" },
          ].map((app) => (
            <DockBtn key={app.label} {...app} />
          ))}
        </div>

        <p
          className="mt-6 text-sm"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          + all your other installed apps
        </p>
      </section>

      {/* ── Download section ── */}
      <section id="download" className="relative z-10 px-6 py-24">
        <div
          className="max-w-3xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(94,106,210,0.22) 0%, rgba(124,131,247,0.1) 100%)",
            border: "1px solid rgba(124,131,247,0.25)",
            backdropFilter: "blur(40px)",
          }}
        >
          {/* Inner orb */}
          <div
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(94,106,210,0.5) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          <div className="relative">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-4xl mb-6"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              🍎
            </div>
            <h2
              className="font-bold text-4xl tracking-tight mb-4"
              style={{ color: "rgba(255,255,255,0.95)" }}
            >
              Desktop Mac App
            </h2>
            <p
              className="text-base max-w-md mx-auto mb-10"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Install the lightweight Mac companion app to enable remote access. Once running, control your Mac from any browser — no port-forwarding required.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="#"
                className="flex items-center gap-3 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "white",
                  backdropFilter: "blur(12px)",
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Download for macOS
              </a>
              <Link
                href="/home"
                className="flex items-center gap-3 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:scale-105"
                style={{
                  background:
                    "linear-gradient(135deg, #5E6AD2 0%, #8B91FF 100%)",
                  boxShadow: "0 0 24px rgba(94,106,210,0.4)",
                  color: "white",
                }}
              >
                Use in Browser →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 px-8 py-10 border-t"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #5E6AD2, #7C83F7)" }}
            >
              M
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              MAC in AIR
            </span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
            Remote Mac control — right in your browser.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Support"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}