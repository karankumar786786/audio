"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { playerActions } from "@/store/player.store";

export function LandingNavbar() {
  const router = useRouter();

  return (
    <header
      className="fixed top-5 inset-x-6 z-50 max-w-5xl mx-auto rounded-full px-6 py-3 flex items-center justify-between"
      style={{
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(20px) saturate(1.8)",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 cursor-pointer group"
        onClick={() => router.push("/")}
      >
        <div className="w-7 h-7 rounded-full overflow-hidden group-hover:scale-105 transition-transform duration-300 ">
          <Image src="/image.png" alt="One Melody" width={28} height={28} className="w-full h-full object-cover" />
        </div>
        <span className="text-[13px] font-bold tracking-widest text-zinc-800 italic uppercase">
          ONE MELODY
        </span>
      </div>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-7 text-[11px] font-semibold uppercase tracking-widest text-black">
        <a href="#features" className="hover:text-zinc-900 transition-colors duration-150">Features</a>
        <a href="#specs" className="hover:text-zinc-900 transition-colors duration-150">Specs</a>
        <a href="#faq" className="hover:text-zinc-900 transition-colors duration-150">FAQ</a>
      </nav>

      {/* CTA */}
      <button
        onClick={() => playerActions.openAuthModal()}
        className="px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 active:scale-95 bg-zinc-900 text-white hover:bg-zinc-700"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}
      >
        Listen Now
      </button>
    </header>
  );
}
