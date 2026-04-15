"use client";

import { Home, Search, Library, Heart, History, PlusSquare, Disc, Mic2, Compass } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const menuItems = [
  { icon: Home, label: "Discover", href: "/home" },
  { icon: Compass, label: "Browse", href: "/browse" },
  { icon: Disc, label: "Radio", href: "/radio" },
];

const libraryItems = [
  { icon: Library, label: "Your Library", href: "/library" },
  { icon: Heart, label: "Liked Songs", href: "/favourites" },
  { icon: History, label: "Listening History", href: "/history" },
];

export function LeftSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-8">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 group cursor-pointer">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <Mic2 className="text-white fill-white" size={24} />
          </div>
          <span className="text-xl font-black tracking-tight italic text-white uppercase">AudioSync</span>
        </div>

        <div className="space-y-8">
          {/* Main Menu */}
          <section>
            <h3 className="px-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 italic">Menu</h3>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    pathname === item.href
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </section>

          {/* Library Section */}
          <section>
            <h3 className="px-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 italic">Your Collection</h3>
            <nav className="space-y-1">
              {libraryItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    pathname === item.href
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </section>
        </div>
      </div>

      {/* Upgrade Call-to-action */}
      <div className="mt-auto p-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 text-white overflow-hidden relative group cursor-pointer shadow-2xl"
        >
          <div className="relative z-10">
            <h4 className="font-black text-sm mb-1 uppercase italic">AudioSync Pro</h4>
            <p className="text-[10px] text-indigo-100 mb-4 font-medium opacity-80 leading-relaxed">Unlock high-fidelity streaming and offline mode.</p>
            <button className="w-full py-2 bg-white text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg">Upgrade Now</button>
          </div>
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
        </motion.div>
      </div>
    </aside>
  );
}
