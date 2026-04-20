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
import { toast } from "sonner";

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
    if (!ms) return "0:00";
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
      {/* <div className="flex items-center gap-6">
        <Link 
          href="/artists"
          className="w-12 h-12 rounded-full border border-white/5 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all group"
        >
          <ArrowLeft size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
        </Link>
      </div> */}

      {/* Hero Banner */}
      <section className="relative h-[480px] w-full overflow-hidden rounded-[3.5rem] border border-white/5 shadow-2xl group">
        <div className="absolute inset-0 bg-zinc-950">
          {artist?.bannerImageKey ? (
            <img 
              src={bannerUrl} 
              alt={artist.name}
              className="h-full w-full object-cover opacity-30 blur-sm group-hover:scale-110 group-hover:opacity-50 transition-all duration-[2s]"
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-primary/20 via-zinc-950 to-black" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-end p-12 gap-10 z-20">
          {/* Main Portrait */}
          <div className="h-64 w-64 shrink-0 overflow-hidden rounded-[2.5rem] border-8 border-black/50 shadow-2xl hidden md:block group-hover:scale-105 transition-transform duration-700 relative">
             {artist?.coverImageKey ? (
               <img src={coverUrl} alt={artist.name} className="h-full w-full object-cover" />
             ) : (
               <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-zinc-700 text-6xl font-black italic">
                 {artist?.name?.charAt(0)}
               </div>
             )}
          </div>

          <div className="flex-1 space-y-6 pb-4">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic drop-shadow-lg">
                Verified Artist Profile
              </span>
              <h1 className="text-7xl md:text-8xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                {artist?.name}
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  if (songs.length > 0) {
                    playerActions.playAll(mapListToPlayerSongs(songs));
                    toast.success("Playing Discography", {
                      description: `Starting playback for ${songs.length} tracks by ${artist?.name}.`,
                    });
                  }
                }}
                disabled={songs.length === 0}
                className="px-12 h-16 bg-primary text-black rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-primary/20 disabled:opacity-50"
              >
                <Play fill="black" size={20} />
                Stream All
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Tracks (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                Popular Tracks
              </h3>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                {songs.length} Available
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 w-full px-6 py-2 text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] italic mb-2">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6 md:col-span-5">Track Info</div>
              <div className="col-span-3 hidden md:block">Metatag</div>
              <div className="col-span-2 md:col-span-1 text-right md:text-left">Time</div>
              <div className="hidden md:block col-span-2" />
            </div>

            <div className="flex flex-col gap-2">
              {songs.length > 0 ? (
                songs.map((song: any, index: number) => (
                  <div
                    key={song.id}
                    onClick={() => playerActions.playSong(mapToPlayerSong(song))}
                    className="group grid grid-cols-12 items-center gap-4 p-5 rounded-[2.5rem] hover:bg-white/3 border border-transparent hover:border-white/5 transition-all duration-300 text-left cursor-pointer"
                  >
                    {/* Index */}
                    <div className="col-span-1 text-center text-zinc-600 font-black text-xs group-hover:text-primary transition-colors italic">
                      {(index + 1).toString().padStart(2, "0")}
                    </div>

                    {/* Image & Title */}
                    <div className="col-span-6 md:col-span-5 flex items-center gap-6">
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
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <Play fill="white" size={16} className="text-white" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors truncate text-lg">
                          {song.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {song.language && (
                            <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[8px] text-primary font-black uppercase tracking-widest whitespace-nowrap">
                              {song.language}
                            </span>
                          )}
                          <span className="text-[9px] text-zinc-500 font-black uppercase italic tracking-widest truncate md:hidden">
                            {song.genre}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Genre (Desktop) */}
                    <div className="col-span-3 hidden md:block">
                      <span className="text-zinc-400 font-black uppercase italic tracking-widest text-[10px] group-hover:text-white transition-colors truncate block">
                        {song.genre || "Acoustic"}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="col-span-2 md:col-span-1 flex items-center justify-end md:justify-start gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest italic group-hover:text-white transition-colors tabular-nums">
                      <Clock size={12} className="text-zinc-600 group-hover:text-primary transition-colors hidden md:block" />
                      <span>{formatDuration(song.duration)}</span>
                    </div>

                    <div className="hidden md:block col-span-2" />
                  </div>
                ))
              ) : (
                <div className="py-28 text-center border-2 border-dashed border-zinc-900 rounded-[4rem]">
                  <Music className="mx-auto text-zinc-800 mb-6" size={56} />
                  <p className="text-zinc-600 font-black uppercase italic tracking-[0.3em] text-[10px]">Transmission Silent</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                Biography
              </h3>
              <div className="h-px flex-1 bg-linear-to-r from-primary/30 to-transparent" />
            </div>

            <div className="relative group">
              {/* Glass Card */}
              <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-[2s]" />
              <div className="relative p-10 rounded-[3.5rem] bg-zinc-900/40 border border-white/5 space-y-8 backdrop-blur-3xl shadow-2xl">
                <p className="text-zinc-400 text-sm font-medium leading-relaxed italic opacity-80 first-letter:text-4xl first-letter:font-black first-letter:text-white first-letter:mr-2">
                  {artist?.about || "This artist has chosen to remain an enigma, letting their frequencies speak for themselves through the neural pathways of the network."}
                </p>

                <div className="pt-8 border-t border-white/5 space-y-5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                    <span className="text-zinc-500">Node Activation</span>
                    <span className="text-primary">{formatDate(artist?.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                    <span className="text-zinc-500">Security Status</span>
                    <div className="flex items-center gap-1.5 text-white">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span>Verified Profile</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                    <span className="text-zinc-500">Frequency Count</span>
                    <span className="text-white tabular-nums">{songs.length} Tracks Loaded</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
