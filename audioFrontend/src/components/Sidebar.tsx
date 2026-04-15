"use client";

import { Home, Compass, Library, Search, PlusSquare, Heart, Mic2, Disc } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { icon: Home, label: "Discover", href: "/home" },
    { icon: Compass, label: "Browse", href: "#" },
    { icon: Disc, label: "Radio", href: "#" },
  ];

  const libraryItems = [
    { icon: Library, label: "Your Library", href: "#" },
    { icon: Mic2, label: "Artists", href: "#" },
    { icon: Heart, label: "Liked Songs", href: "#" },
  ];

  return (
    <aside className="w-72 bg-zinc-950/50 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 overflow-hidden z-50">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10 group cursor-pointer">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <Mic2 className="text-white" size={24} />
          </div>
          <span className="text-xl font-black tracking-tight italic">AudioSync</span>
        </div>

        <div className="space-y-8">
          <section>
             <h3 className="px-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Menu</h3>
             <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link 
                    key={item.label} 
                    href={item.href}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${pathname === item.href ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                ))}
             </nav>
          </section>

          <section>
             <h3 className="px-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Library</h3>
             <nav className="space-y-1">
                {libraryItems.map((item) => (
                  <button 
                    key={item.label} 
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <item.icon size={20} />
                    {item.label}
                  </button>
                ))}
             </nav>
          </section>
        </div>
      </div>

      <div className="mt-auto p-8">
         <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white overflow-hidden relative group">
            <div className="relative z-10">
               <h4 className="font-bold mb-2">Sync Everywhere</h4>
               <p className="text-[10px] text-indigo-100 mb-4 font-medium opacity-80">Upgrade to Pro for seamless multi-device playback.</p>
               <button className="w-full py-2 bg-white text-indigo-600 rounded-xl text-xs font-black shadow-lg hover:scale-105 transition-transform">Get Pro</button>
            </div>
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
         </div>
      </div>
    </aside>
  );
}
