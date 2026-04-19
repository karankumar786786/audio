"use client";

import { useQuery } from "@tanstack/react-query";
import { musicApi } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getImageUrl } from "@/lib/image-utils";
import {   Play,  ArrowLeft, Clock, Calendar, Music } from "lucide-react";
import { playerActions } from "@/store/player.store";
import { mapToPlayerSong, mapListToPlayerSongs } from "@/lib/player-utils";

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

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  if (isArtistLoading || isSongsLoading) {
    return (
      <div className="p-20 text-center animate-pulse text-zinc-500 uppercase font-black text-xs italic tracking-widest">
        Synchronizing Vocal Node Memory...
      </div>
    );
  }

  const artist = artistResponse?.data;
  const songs = songsResponse?.data?.data || [];
  
  const bannerUrl = getImageUrl(artist?.bannerImageKey, { 
    width: 1600, 
    height: 800, 
    focus: "auto",
    aspectRatio: "2-1" 
  });
  
  const coverUrl = getImageUrl(artist?.coverImageKey, { 
    width: 400, 
    height: 400, 
    focus: "face",
    aspectRatio: "1-1" 
  });

  return (
    <div className="px-10 pb-20 space-y-12">
      {/* Header Navigation */}
      <div className="flex items-center gap-6">
        <Link 
          href="/artists"
          className="w-12 h-12 rounded-full border border-white/5 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all group"
        >
          <ArrowLeft size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
        </Link>
      </div>

      {/* Hero Banner */}
      <section className="relative h-[450px] w-full overflow-hidden rounded-[4rem] border border-white/5 shadow-2xl group">
        <div className="absolute inset-0 bg-zinc-950">
          {artist?.bannerImageKey ? (
            <img 
              src={bannerUrl} 
              alt={artist.name}
              className="h-full w-full object-cover opacity-40 blur-sm group-hover:scale-110 group-hover:opacity-60 transition-all duration-[2s]"
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-indigo-950 via-zinc-950 to-black" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-end p-12 gap-10 z-20">
          {/* Main Portrait */}
          <div className="h-56 w-56 shrink-0 overflow-hidden rounded-[3rem] border-8 border-black shadow-2xl hidden md:block group-hover:scale-105 transition-transform duration-700">
             {artist?.coverImageKey ? (
               <img src={coverUrl} alt={artist.name} className="h-full w-full object-cover" />
             ) : (
               <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-zinc-700 text-6xl font-black italic">
                 {artist?.name?.charAt(0)}
               </div>
             )}
          </div>

          <div className="flex-1 space-y-4">
            
            <h1 className="text-7xl md:text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl">
              {artist?.name}
            </h1>

            <div className="pt-4 flex items-center gap-4">
              <button 
                onClick={() => songs.length > 0 && playerActions.playAll(mapListToPlayerSongs(songs))}
                disabled={songs.length === 0}
                className="px-12 h-16 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-white/10 disabled:opacity-50"
              >
                <Play fill="black" size={18} />
                Play All
              </button>
            </div>
          </div>
        </div>
      </section>
              {/* Right: Sidebar Info */}
        <div className="space-y-8">
           <div className="flex items-center gap-4 mb-8">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
              About Node
            </h3>
            <div className="h-px flex-1 bg-linear-to-r from-indigo-500/30 to-transparent" />
          </div>

          <div className="p-8 rounded-[3rem] bg-zinc-900/40 border border-white/5 space-y-6 backdrop-blur-3xl shadow-2xl">
            <p className="text-zinc-400 text-sm font-medium leading-relaxed italic opacity-80">
              {artist?.about || "This vocal node has not yet submitted a synchronization dossier to the network. Their frequency remains purely acoustic."}
            </p>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                <span className="text-zinc-500">Date of Birth</span>
                <span className="text-indigo-400">{formatDate(artist?.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                <span className="text-zinc-500">Verified</span>
                <span className="text-white">Yes</span>
              </div>
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                <span className="text-zinc-500">Total songs</span>
                <span className="text-white">4</span>
              </div>
            </div>
          </div>
        </div>
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Tracks */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
            Popular songs
            </h3>
          </div>

          <div className="flex flex-col gap-2">
            {songs.length > 0 ? (
              songs.map((song: any, index: number) => (
                <button
                  key={song.id}
                  onClick={() => playerActions.playSong(mapToPlayerSong(song))}
                  className="group flex items-center gap-6 p-4 rounded-3xl hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] transition-all duration-300 text-left"
                >
                  <div className="w-8 text-center text-zinc-600 font-black text-xs group-hover:text-indigo-400 transition-colors italic">
                    {(index + 1).toString().padStart(2, "0")}
                  </div>

                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
                    {getImageUrl(song.imageKey, { width: 100, height: 100, aspectRatio: "1-1" }) ? (
                      <img
                        src={getImageUrl(song.imageKey, { width: 100, height: 100, aspectRatio: "1-1" })!}
                        alt={song.title}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                        <Music size={20} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play fill="white" size={16} className="text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-black italic uppercase tracking-tighter text-white group-hover:text-indigo-400 transition-colors truncate text-lg">
                      {song.title}
                    </h4>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 italic group-hover:text-zinc-300 transition-colors flex items-center gap-2">
                       {song.language && (
                         <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] text-indigo-400">
                           {song.language}
                         </span>
                       )}
                       <span>{song.genre}</span>
                       <span className="opacity-30">•</span> 
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-8 text-zinc-400 text-[10px] font-black uppercase tracking-widest italic group-hover:text-white transition-colors">
                    <div className="flex items-center gap-2 w-20 justify-end">
                      <Clock size={12} className="text-indigo-500/50" />
                      {formatDuration(song.duration || song.durationMs || 0)}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-[3rem]">
                <Music className="mx-auto text-zinc-800 mb-4" size={48} />
                <p className="text-zinc-600 font-black uppercase italic tracking-widest">No Frequencies Detected</p>
              </div>
            )}
          </div>
        </div>

       
      </div>
    </div>
  );
}
