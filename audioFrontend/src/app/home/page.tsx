"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { musicApi, type Song } from "../../lib/api";
import { SongCard } from "../../components/SongCard";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Clock, Compass } from "lucide-react";

export default function HomePage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["discover-songs"],
    queryFn: ({ pageParam }) => musicApi.getFeed(pageParam as number, 15),
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
    <div className="px-10 pb-20">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-20 relative rounded-[3rem] overflow-hidden group shadow-2xl"
      >
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-600 to-purple-900 p-20 relative overflow-hidden ring-1 ring-white/10">
          <div className="relative z-10 max-w-3xl py-10">
            <div className="flex items-center gap-3 mb-6 bg-white/10 backdrop-blur-md w-fit px-4 py-1.5 rounded-full border border-white/10">
              <Sparkles className="text-indigo-300" size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">Synthetic Frequency</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter mb-8 leading-[0.85] uppercase">
              Immerse In<br/><span className="text-indigo-300">New Dimensions.</span>
            </h1>
            <p className="text-xl text-indigo-100 opacity-80 mb-12 font-medium leading-relaxed max-w-xl">
              Sync your soul with word-level high fidelity audio. 
              Discover deep-cuts and trending transients curated by your listening frequency.
            </p>
            <div className="flex items-center gap-6">
              <button className="px-10 py-5 bg-white text-indigo-700 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-3">
                <TrendingUp size={18} />
                Explore Trends
              </button>
              <button className="px-10 py-5 bg-zinc-900/60 backdrop-blur-xl text-white rounded-3xl font-black text-xs uppercase tracking-widest border border-white/10 hover:bg-zinc-900 transition-all">
                The Lab
              </button>
            </div>
          </div>

          {/* Abstract visuals */}
          <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
          <Compass className="absolute top-20 right-20 text-white/5 w-80 h-80 -rotate-12 pointer-events-none" />
        </div>
      </motion.section>

      {/* Discovery Feed */}
      <section>
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Discovery Stream</h2>
            <div className="h-px w-24 bg-gradient-to-r from-indigo-500 to-transparent" />
          </div>
          <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-black uppercase tracking-widest italic group cursor-pointer hover:text-white transition-colors">
            <Clock size={14} />
            <span>Frequency: Recent</span>
          </div>
        </div>

        {status === "pending" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <div key={i} className="aspect-square bg-zinc-900/40 border border-white/5 rounded-[3rem] animate-pulse" />
            ))}
          </div>
        ) : status === "error" ? (
          <div className="p-32 text-center text-zinc-500 border-2 border-dashed border-zinc-900 rounded-[4rem] font-bold italic tracking-tight">
            COMMUNICATION ERROR: SYSTEM SYNC FAILED
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
            {data?.pages.map((page, i) => (
              page.data.data.map((song, songIdx) => (
                <SongCard 
                  key={`${song.id}-${i}-${songIdx}`} 
                  song={song} 
                  priority={i === 0 && songIdx < 6}
                />
              ))
            ))}
          </div>
        )}

        {/* Loader/Trigger */}
        <div id="infinite-scroll-trigger" className="h-40 flex items-center justify-center mt-20">
          {isFetchingNextPage && (
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

