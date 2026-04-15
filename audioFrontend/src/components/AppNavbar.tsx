"use client";

import { Search, Bell, Settings, User, Sparkles, X, History } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { musicApi } from "@/lib/api";
import { playerStore } from "@/store/player.store";
import { useStore } from "@tanstack/react-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function AppNavbar() {
  const { user, loginWithRedirect, logout, isAuthenticated } = useAuth0();
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const queryClient = useQueryClient();
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch History
  const { data: searchHistory } = useQuery({
    queryKey: ["search-history", systemUser?.sub],
    queryFn: () => musicApi.users.getSearchHistory(systemUser!.sub, 1, 5),
    enabled: !!systemUser?.sub && isFocused,
  });

  const saveHistory = useMutation({
    mutationFn: (text: string) => musicApi.users.saveSearchHistory(systemUser!.sub, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["search-history"] }),
  });

  const clearHistory = useMutation({
    mutationFn: () => musicApi.users.clearSearchHistory(systemUser!.sub),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["search-history"] }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (systemUser?.sub) saveHistory.mutate(query.trim());
    // Trigger actual search navigation if needed
    console.log("Searching for:", query);
    setIsFocused(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full px-10 py-6 flex items-center justify-between pointer-events-none">
      {/* Search Input Container */}
      <div className="flex items-center gap-6 pointer-events-auto relative" ref={menuRef}>
        <form onSubmit={handleSearch} className="relative group overflow-hidden rounded-2xl w-96">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search for tracks, artists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-2xl py-3 pl-14 pr-8 text-xs font-bold focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none w-full text-white placeholder-zinc-500 shadow-2xl"
          />
        </form>

        {/* Search History Dropdown */}
        <AnimatePresence>
          {isFocused && systemUser && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-4 w-96 bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Recent Searches</span>
                <button 
                  onClick={() => clearHistory.mutate()}
                  className="text-[10px] font-black text-indigo-400 hover:text-white transition-colors"
                >
                  CLEAR ALL
                </button>
              </div>
              <div className="p-2">
                {searchHistory?.data?.data.length === 0 ? (
                  <div className="p-4 text-center text-zinc-600 text-[10px] font-bold italic">Memory empty.</div>
                ) : (
                  searchHistory?.data?.data.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => { setQuery(item.searchedText); setIsFocused(false); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all text-left group"
                    >
                      <History size={14} className="text-zinc-600 group-hover:text-indigo-400" />
                      <span className="text-xs font-medium text-zinc-300 group-hover:text-white truncate">{item.searchedText}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User & Actions */}
      <div className="flex items-center gap-4 pointer-events-auto">
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
             <motion.div 
              whileHover={{ scale: 1.05 }}
              onClick={() => logout()}
              className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-transparent hover:border-red-500 transition-all cursor-pointer shadow-2xl ring-4 ring-black group relative"
             >
               <img src={user?.picture || "https://avatar.vercel.sh/me"} className="w-full h-full object-cover" alt="Profile" />
               <div className="absolute inset-0 bg-red-500/80 items-center justify-center hidden group-hover:flex">
                  <X size={20} className="text-white" />
               </div>
             </motion.div>
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
