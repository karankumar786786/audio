"use client";

import { useQuery } from "@tanstack/react-query";
import { musicApi, type Song } from "@/lib/api";
import { SongCard } from "@/components/SongCard";
import { useStore } from "@tanstack/react-store";
import { playerStore } from "@/store/player.store";
import { History, Clock } from "lucide-react";

export default function HistoryPage() {
  const systemUser = useStore(playerStore, (s) => s.systemUser);

  const { data: historyResponse, isLoading } = useQuery({
    queryKey: ["history", systemUser?.sub],
    queryFn: () => musicApi.users.getHistory(systemUser!.sub),
    enabled: !!systemUser?.sub,
  });

  const songs = historyResponse?.data?.data || [];

  return (
    <div className="px-10 pb-20">
      <header className="relative h-[300px] rounded-[3rem] overflow-hidden mb-12 shadow-2xl flex items-end">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-zinc-950 to-black">
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        </div>

        <div className="relative z-20 p-12 flex items-center gap-10">
           <div className="w-48 h-48 bg-indigo-500 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 border border-white/10 flex items-center justify-center">
              <History className="text-white" size={64} />
           </div>

           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 italic">Temporal Flux</span>
                 <div className="h-1 w-8 bg-indigo-500 rounded-full" />
              </div>
              <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">History</h1>
              <p className="text-zinc-500 text-sm font-medium opacity-80 max-w-xl">A timeline of your acoustic journey through the system.</p>
           </div>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-12 px-2">
           <div className="flex items-center gap-6">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Recent Echoes</h2>
              <div className="h-px w-24 bg-gradient-to-r from-indigo-500 to-transparent" />
           </div>
           <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">
              <Clock size={14} />
              <span>{songs.length} Events Logged</span>
           </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="aspect-square bg-zinc-900/40 border border-white/5 rounded-[3rem] animate-pulse" />
            ))}
          </div>
        ) : songs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
            {songs.map((song: Song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center text-zinc-500 border-2 border-dashed border-zinc-900 rounded-[4rem] font-bold italic tracking-tight uppercase px-10">
            {systemUser ? "NO TEMPORAL DATA FOUND" : "AUTHENTICATION REQUIRED TO FETCH HISTORY"}
          </div>
        )}
      </section>
    </div>
  );
}
