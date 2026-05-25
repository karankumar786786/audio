"use client";

import React from "react";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10"
      style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-black/8">
          <Image src="/image.png" alt="One Melody" width={20} height={20} className="w-full h-full object-cover" />
        </div>
        <span className="text-xs font-medium text-zinc-400">© 2026 One Melody. Precision engineered sound.</span>
      </div>
      <div className="flex gap-5 text-[11px] font-semibold text-zinc-400">
        <a href="#" className="hover:text-zinc-700 transition-colors">Twitter</a>
        <a href="#" className="hover:text-zinc-700 transition-colors">GitHub</a>
        <a href="#" className="hover:text-zinc-700 transition-colors">Discord</a>
      </div>
    </footer>
  );
}
