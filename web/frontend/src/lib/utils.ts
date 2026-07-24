'use client'

import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useEffect } from "react";
import {  Globe, SquareTerminal,} from 'lucide-react';
import { Action } from "@/types";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export const features = [
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

export const macApps = [
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

export function useScrollReveal() {
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
 

export const ACTIONS: Action[] = [
  { label: 'Terminal', icon: SquareTerminal , type: 'OPEN_APP', payload: { app: 'Terminal' } },
  // { label: 'Browser', icon: Globe, type: 'OPEN_APP', payload: { app: 'Safari' } },
  // { label: 'Notes', icon: NotepadText, type: 'OPEN_APP', payload: { app: 'Notes' } },
];