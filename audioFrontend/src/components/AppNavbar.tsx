"use client";

import { Search, Bell, Settings, User, Sparkles } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion } from "framer-motion";

export function AppNavbar() {
  const { user, loginWithRedirect, logout, isAuthenticated } = useAuth0();

  return (
    <header className="sticky top-0 z-40 w-full px-10 py-6 flex items-center justify-between pointer-events-none">
      {/* Search Input */}
      <div className="flex items-center gap-6 pointer-events-auto">
        <div className="relative group overflow-hidden rounded-2xl">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search for tracks, artists..."
            className="bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-2xl py-3 pl-14 pr-8 text-xs font-bold focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none w-96 text-white placeholder-zinc-500 shadow-2xl"
          />
        </div>
      </div>

      {/* User & Actions */}
      <div className="flex items-center gap-4 pointer-events-auto">
        {/* Credits/Status */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="hidden md:flex items-center gap-2 bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-2xl px-5 py-3 shadow-2xl cursor-pointer"
        >
          <Sparkles className="text-indigo-400" size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">High Fidelity Enabled</span>
        </motion.div>

        <button className="w-12 h-12 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-2xl">
          <Bell size={20} />
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="group relative">
               <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all cursor-pointer shadow-2xl ring-4 ring-black"
               >
                 <img src={user?.picture || "https://avatar.vercel.sh/me"} className="w-full h-full object-cover" alt="Profile" />
               </motion.div>
               {/* Simple logout menu on hover or click would go here */}
            </div>
          </div>
        ) : (
          <button 
            onClick={() => loginWithRedirect()}
            className="px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-2xl flex items-center gap-2"
          >
            <User size={14} />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
