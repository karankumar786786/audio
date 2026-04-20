"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { musicApi } from "@/lib/api";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ListMusic, Play,  Trash2, Clock, Music, ArrowLeft, Calendar, Share2, Sparkles } from "lucide-react";
import { playerActions, playerStore } from "@/store/player.store";
import { mapListToPlayerSongs, mapToPlayerSong } from "@/lib/player-utils";
import { useStore } from "@tanstack/react-store";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/image-utils";

export default function PlaylistPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const systemUser = useStore(playerStore, (s) => s.systemUser);

  const playlistType = searchParams.get("type");

  const { data: playlistResponse, isLoading: isPlaylistLoading } = useQuery({
    queryKey: ["playlist", id, playlistType],
    queryFn: async () => {
      if (playlistType === "user") {
        return await musicApi.users.getPlaylistById(id as string);
      } else if (playlistType === "system") {
        return await musicApi.playlists.getById(id as string);
      } else {
        try {
          return await musicApi.playlists.getById(id as string);
        } catch (err) {
          return await musicApi.users.getPlaylistById(id as string);
        }
      }
    },
  });

  const { data: songsResponse, isLoading: isSongsLoading } = useQuery({
    queryKey: ["playlist-songs", id, playlistType],
    queryFn: async () => {
      if (playlistType === "user") {
        return await musicApi.users.getPlaylistSongs(id as string);
      } else if (playlistType === "system") {
        return await musicApi.playlists.getSongs(id as string);
      } else {
        try {
          const res = await musicApi.playlists.getSongs(id as string);
          if (res.success && res.data.data.length > 0) return res;
          return res;
        } catch (err) {
          return await musicApi.users.getPlaylistSongs(id as string);
        }
      }
    },
  });

  const deletePlaylist = useMutation({
    mutationFn: () => musicApi.users.deletePlaylist(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
      router.push("/playlists");
    },
  });

  const removeSong = useMutation({
    mutationFn: (songId: string) =>
      musicApi.users.removeSongFromPlaylist(
        id as string,
        songId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-songs", id], exact: false });
    },
  });

  const formatDuration = (ms: number) => {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };



  if (isPlaylistLoading || isSongsLoading) {
    return (
      <div className="p-20 text-center animate-pulse text-zinc-500 uppercase font-black text-xs italic tracking-widest">
        Loading Playlist Details
      </div>
    );
  }

  const playlist = playlistResponse?.data;
  const songs = songsResponse?.data?.data || [];
  const isUserPlaylist = playlistType === "user" || (playlist && "userId" in playlist);

  const handleStreamAll = () => {
    if (songs.length === 0) return;
    const playerSongs = mapListToPlayerSongs(songs);
    playerActions.playAll(playerSongs);
    toast.success("Playing All", {
      description: `Starting playback for ${songs.length} tracks.`,
    });
  };

  const bannerUrl = getImageUrl(playlist?.bannerImageKey, {
    width: 1600,
    height: 800,
    focus: "auto",
    aspectRatio: "2-1"
  });
  const coverUrl = getImageUrl(playlist?.coverImageKey, {
    width: 400,
    height: 400,
    focus: "auto",
    aspectRatio: "1-1"
  });

  return (
    <div className="px-10 pb-20 space-y-12">
     

      {/* Playlist Hero */}
      <section className="relative h-[480px] w-full overflow-hidden rounded-[3.5rem] border border-white/5 shadow-2xl group">
        <div className="absolute inset-0 bg-zinc-950">
          {playlist?.bannerImageKey ? (
            <img
              src={bannerUrl}
              alt=""
              className="h-full w-full object-cover opacity-30 blur-sm group-hover:scale-110 group-hover:opacity-50 transition-all duration-[2s]"
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-primary/20 via-zinc-950 to-black" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-end p-12 gap-10 z-20">
          {/* Cover Art */}
          <div className="h-64 w-64 shrink-0 overflow-hidden rounded-[2.5rem] border-8 border-black/50 shadow-2xl  md:block group-hover:scale-105 transition-transform duration-700 relative bg-zinc-900 flex items-center justify-center">
            {playlist?.coverImageKey ? (
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ListMusic className="text-zinc-800" size={80} />
            )}
          </div>

          <div className="flex-1 space-y-6 pb-4">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic drop-shadow-lg">
                Playlist
              </span>
              <h1 className="text-7xl md:text-8xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                {playlist?.title || playlist?.name}
              </h1>
            </div>

            <p className="max-w-xl text-zinc-500 font-medium italic text-sm opacity-80 line-clamp-2 leading-relaxed">
              {playlist?.description || "A synchronized frequency cluster compiled for optimal neural resonance within the acoustic spectrum."}
            </p>

            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={handleStreamAll}
                disabled={songs.length === 0}
                className="px-12 h-16 bg-primary text-black rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-primary/20 disabled:opacity-50"
              >
                <Play fill="black" size={20} />
                Play All
              </button>

              {isUserPlaylist && (
                <button
                  onClick={() => {
                      toast.promise(deletePlaylist.mutateAsync(), {
                        loading: "Delete Playlist...",
                        success: "Playlist Deleted",
                        error: "Delete Failed",
                        description: "The playlist has been deleted."
                      });
                    }
                  }
                  className="h-16 w-16 rounded-3xl bg-red-500/10 border border-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10"
                  title="Delete Playlist"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tracks Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
              Songs
            </h3>
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
              {songs.length} Nodes
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 w-full px-6 py-2 text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] italic mb-2">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6 md:col-span-6">Title</div>
            <div className="col-span-3 hidden md:block">Artist</div>
            <div className="col-span-2 md:col-span-1 text-right md:text-left">Duration</div>
            <div className="hidden md:block col-span-1" />
          </div>

          <div className="flex flex-col gap-2">
            {songs.length > 0 ? (
              songs.map((song: any, index: number) => (
                <div
                  key={song.id}
                  onClick={() => playerActions.playSong(mapToPlayerSong(song))}
                  className="group  grid grid-cols-12 items-center gap-4 p-5 rounded-[2.5rem] hover:bg-white/3 border border-white/5  transition-all duration-300 text-left cursor-pointer"
                >
                  {/* Index */}
                  <div className="col-span-1 text-center text-zinc-600 font-black text-xs group-hover:text-primary transition-colors italic">
                    {(index + 1).toString().padStart(2, "0")}
                  </div>

                  {/* Title & Image */}
                  <div className="col-span-6 md:col-span-6 flex items-center gap-6">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
                      {(song.imageKey || song.coverImageKey) ? (
                        <img
                          src={getImageUrl(song.imageKey || song.coverImageKey, { width: 100, height: 100, aspectRatio: "1-1" })!}
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
                      <h4 className="font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors truncate text-lg leading-tight">
                        {song.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {song.language && (
                          <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[8px] text-primary font-black uppercase tracking-widest whitespace-nowrap">
                            {song.language}
                          </span>
                        )}
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic group-hover:text-zinc-300 transition-colors block md:hidden truncate">
                          {song.artistName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Artist */}
                  <div className="col-span-3 hidden md:block">
                    <span className="text-zinc-400 font-black uppercase italic tracking-widest text-[10px] group-hover:text-white transition-colors truncate block">
                      {song.artistName}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="col-span-2 md:col-span-1 flex items-center justify-end md:justify-start gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest italic group-hover:text-white transition-colors tabular-nums">
                    <Clock size={12} className="text-zinc-600 group-hover:text-primary transition-colors hidden md:block" />
                    <span>{formatDuration(song.duration)}</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 md:col-span-1 flex items-center justify-end gap-6 pr-4">
                    {isUserPlaylist ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.promise(removeSong.mutateAsync(song.id), {
                            loading: "Severing Node...",
                            success: "Track Removed",
                            error: "Failed to remove",
                            description: "The song has been decoupled from this cluster."
                          });
                        }}
                        className="p-3 rounded-xl bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg shadow-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                       <div className="w-10" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-32 text-center border-2 border-dashed border-zinc-900 rounded-[4rem]">
                <Music className="mx-auto text-zinc-800 mb-6" size={64} />
                <p className="text-zinc-600 font-black uppercase italic tracking-[0.3em] text-[10px]">Neural Pathways Empty</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
