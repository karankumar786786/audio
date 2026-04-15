"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { api, type Song } from "../../lib/api";
import { SongCard } from "../../components/SongCard";
import { Sidebar } from "../../components/Sidebar";
import { MusicPlayer } from "../../components/MusicPlayer";
import { LyricsOverlay } from "../../components/LyricsOverlay";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Bell, Sparkles, TrendingUp, Clock } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

export default function HomePage() {
  const { user } = useAuth0();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["discover-songs"],
    queryFn: ({ pageParam }) => api.songs.list(pageParam as number, 15),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.data.pagination.hasNext ? lastPage.data.pagination.page + 1 : undefined,
  });

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const target = document.getElementById("infinite-scroll-trigger");
    if (target) observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans selection:bg-indigo-500/30">
      <Sidebar />
      <LyricsOverlay />

      <main className="flex-1 ml-72 flex flex-col relative">
        {/* Top Floating Header */}
        <header className="sticky top-0 z-40 px-12 py-8 flex items-center justify-between pointer-events-none">
           <div className="flex items-center gap-6 pointer-events-auto">
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-500 transition-colors">
                    <Search size={18} />
                 </div>
                 <input 
                  type="text" 
                  placeholder="Songs, artists, or moods..."
                  className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl py-2.5 pl-12 pr-6 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none w-80 text-white placeholder-zinc-500"
                 />
              </div>
           </div>

           <div className="flex items-center gap-4 pointer-events-auto">
              <button className="w-12 h-12 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all"><Bell size={20} /></button>
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 ring-2 ring-transparent hover:ring-indigo-500 transition-all cursor-pointer shadow-xl">
                 <img src={user?.picture || "https://avatar.vercel.sh/me"} className="w-full h-full object-cover" alt="Profile" />
              </div>
           </div>
        </header>

        {/* Dynamic Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-12 pb-32 pt-4">
           
           {/* Hero Section */}
           <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 relative rounded-[40px] overflow-hidden group"
           >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-800 p-16 relative overflow-hidden">
                 <div className="relative z-10 max-w-2xl mt-8">
                    <div className="flex items-center gap-2 mb-4">
                       <Sparkles className="text-indigo-200" size={16} />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100 italic">Curated for you</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter mb-6 leading-[0.9]">
                       DISCOVER YOUR<br/>NEW SOUND.
                    </h1>
                    <p className="text-lg text-indigo-100 opacity-80 mb-10 font-medium leading-relaxed">
                       A personalized feed based on your listening history and mood.
                       New tracks added every hour.
                    </p>
                    <button className="px-8 py-4 bg-white text-indigo-700 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Start Listening</button>
                 </div>

                 {/* Decorative elements */}
                 <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] animate-pulse" />
                 <TrendingUp className="absolute bottom-10 right-10 text-white/5 w-64 h-64 -rotate-12 pointer-events-none" />
              </div>
           </motion.section>

           {/* Infinite Scroll Feed */}
           <section>
              <div className="flex items-center justify-between mb-8 px-2">
                 <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black italic tracking-tight">EXPLORE FEED</h2>
                    <div className="h-0.5 w-12 bg-indigo-500 rounded-full" />
                 </div>
                 <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold">
                    <Clock size={14} />
                    <span>RECENTLY TRANSCODED</span>
                 </div>
              </div>

              {status === "pending" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="aspect-square bg-zinc-900 rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : status === "error" ? (
                <div className="p-20 text-center text-zinc-500 border-2 border-dashed border-zinc-900 rounded-[40px] italic">Failed to synchronize library. Please check connection.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                  {data?.pages.map((page, i) => (
                    page.data.data.map((song, songIdx) => (
                      <SongCard 
                        key={song.id} 
                        song={song} 
                        priority={i === 0 && songIdx < 6}
                      />
                    ))
                  ))}
                </div>
              )}

              {/* Loader/Trigger */}
              <div id="infinite-scroll-trigger" className="h-20 flex items-center justify-center mt-20">
                {isFetchingNextPage && <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />}
              </div>
           </section>
        </div>

        <MusicPlayer />
      </main>
    </div>
  );
}
