"use client";

import { useQuery } from "@tanstack/react-query";
import { musicApi } from "@/lib/api";
import { SongCard } from "@/components/SongCard";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mic2, Play, Heart, Share2 } from "lucide-react";

export default function ArtistPage() {
  const { id } = useParams();

  const { data: artistResponse, isLoading: isArtistLoading } = useQuery({
    queryKey: ["artist", id],
    queryFn: () => musicApi.artists.getById(id as string),
  });

  const { data: songsResponse, isLoading: isSongsLoading } = useQuery({
    queryKey: ["artist-songs", id],
    queryFn: () => musicApi.artists.getSongs(id as string),
  });

  if (isArtistLoading || isSongsLoading) {
    return (
      <div className="p-20 text-center animate-pulse">
        Synchronizing Artist Data...
      </div>
    );
  }

  const artist = artistResponse?.data;
  const songs = songsResponse?.data?.data || [];

  return (
    <div className="px-10 pb-20">
      {/* Artist Header */}
      <header className="relative h-[400px] rounded-[3rem] overflow-hidden mb-12 shadow-2xl">
        <div className="absolute inset-0 bg-zinc-900">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
          {/* Fallback pattern for artist header */}
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-zinc-950 to-black" />
        </div>

        <div className="absolute bottom-0 left-0 p-16 z-20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Mic2 size={24} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300 italic">
              Verified Frequency
            </span>
          </div>
          <h1 className="text-7xl md:text-9xl font-black text-white italic tracking-tighter uppercase mb-6">
            {artist?.name}
          </h1>

          <div className="flex items-center gap-6">
            <button className="px-10 py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
              <Play fill="black" size={16} />
              Play Discography
            </button>
            <button className="w-16 h-16 rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
              <Heart size={24} />
            </button>
            <button className="w-16 h-16 rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
              <Share2 size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Discography Grid */}
      <section>
        <div className="flex items-center gap-6 mb-12">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
            Full Discography
          </h2>
          <div className="h-px w-24 bg-gradient-to-r from-indigo-500 to-transparent" />
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
