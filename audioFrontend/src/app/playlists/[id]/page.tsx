"use client";

import { useQuery } from "@tanstack/react-query";
import { musicApi } from "@/lib/api";
import { SongCard } from "@/components/SongCard";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ListMusic, Play, Heart, Share2, Clock } from "lucide-react";

export default function PlaylistPage() {
  const { id } = useParams();

  const { data: playlistResponse, isLoading: isPlaylistLoading } = useQuery({
    queryKey: ["playlist", id],
    queryFn: () => musicApi.playlists.getById(id as string),
  });

  const { data: songsResponse, isLoading: isSongsLoading } = useQuery({
    queryKey: ["playlist-songs", id],
    queryFn: () => musicApi.playlists.getSongs(id as string),
  });

  if (isPlaylistLoading || isSongsLoading) {
    return <div className="p-20 text-center animate-pulse text-zinc-500 uppercase font-black text-xs">Accessing Playlist Memory...</div>;
  }

  const playlist = playlistResponse?.data;
  const songs = songsResponse?.data?.data || [];

  return (
    <div className="px-10 pb-20">
      {/* Playlist Hero */}
      <header className="relative h-[300px] rounded-[3rem] overflow-hidden mb-12 shadow-2xl flex items-end">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-zinc-950 to-black">
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        </div>

        <div className="relative z-20 p-12 flex items-center gap-10">
           <div className="w-48 h-48 bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden flex items-center justify-center">
              <ListMusic className="text-zinc-700" size={64} />
           </div>

           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 italic">SYSTEM PLAYLIST</span>
                 <div className="h-1 w-8 bg-indigo-500 rounded-full" />
              </div>
              <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">{playlist?.title}</h1>
              <p className="text-zinc-500 text-sm font-medium opacity-80 max-w-xl">{playlist?.description || "A curated frequency of synchronized audio transients."}</p>
              
              <div className="flex items-center gap-4 pt-4">
                 <button className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2">
                    <Play fill="black" size={14} />
                    Stream All
                 </button>
                 <button className="p-4 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                    <Heart size={20} />
                 </button>
              </div>
           </div>
        </div>
      </header>

      {/* Playlist Grid */}
      <section>
        <div className="flex items-center justify-between mb-12 px-2">
           <div className="flex items-center gap-6">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Tracklist</h2>
              <div className="h-px w-24 bg-gradient-to-r from-purple-500 to-transparent" />
           </div>
           <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-black uppercase tracking-widest italic group cursor-pointer hover:text-white transition-colors">
              <Clock size={14} />
              <span>{songs.length} Synchronized Tracks</span>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
          {songs.map((song: any) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>
    </div>
  );
}
