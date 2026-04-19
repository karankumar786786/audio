"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { musicApi } from "@/lib/api";
import { SongCard } from "@/components/SongCard";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ListMusic, Play, Heart, Trash2, Clock, Music } from "lucide-react";
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

  // 1. Fetch Playlist Info
  const { data: playlistResponse, isLoading: isPlaylistLoading } = useQuery({
    queryKey: ["playlist", id, playlistType],
    queryFn: async () => {
      if (playlistType === "user") {
        return await musicApi.users.getPlaylistById(id as string);
      } else if (playlistType === "system") {
        return await musicApi.playlists.getById(id as string);
      } else {
        // Fallback: try system first, then user
        try {
          return await musicApi.playlists.getById(id as string);
        } catch (err) {
          return await musicApi.users.getPlaylistById(id as string);
        }
      }
    },
  });

  // 2. Fetch Playlist Songs
  const { data: songsResponse, isLoading: isSongsLoading } = useQuery({
    queryKey: ["playlist-songs", id, playlistType],
    queryFn: async () => {
      if (playlistType === "user") {
        return await musicApi.users.getPlaylistSongs(id as string);
      } else if (playlistType === "system") {
        return await musicApi.playlists.getSongs(id as string);
      } else {
        // Fallback logic
        try {
          const res = await musicApi.playlists.getSongs(id as string);
          if (res.success && res.data.data.length > 0) return res;
          // If success but empty, we still returned it. 
          // But if we want to be sure, we could try the other one if this one is 404.
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
      toast.success("Buffer Released", {
        description: "Playlist has been deleted from the system.",
      });
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
      toast.success("Transients Decoupled", {
        description: "Song removed from playlist.",
      });
      queryClient.invalidateQueries({ queryKey: ["playlist-songs", id] });
    },
  });

  if (isPlaylistLoading || isSongsLoading) {
    return (
      <div className="p-20 text-center animate-pulse text-zinc-500 uppercase font-black text-xs">
        Accessing Playlist Memory...
      </div>
    );
  }

  const playlist = playlistResponse?.data;
  const songs = songsResponse?.data?.data || [];
  const isUserPlaylist = playlistType === "user" || (playlist && "userId" in playlist);

  const handleStreamAll = () => {
    if (songs.length === 0) return;
    const playerSongs = mapListToPlayerSongs(songs);
    playerActions.setQueue(playerSongs);
    playerActions.play(playerSongs[0]);
    toast.success("Stream Initialized", {
      description: `Now playing all ${songs.length} tracks.`,
    });
  };

  const bannerUrl = getImageUrl(playlist?.bannerImageKey, { 
    width: 1200, 
    height: 400, 
    focus: "auto",
    aspectRatio: "3-1" 
  });
  const coverUrl = getImageUrl(playlist?.coverImageKey, { 
    width: 400, 
    height: 400, 
    focus: "auto",
    aspectRatio: "1-1" 
  });

  return (
    <div className="px-10 pb-20">
      {/* Playlist Hero */}
      <header className="relative h-[300px] rounded-[3rem] overflow-hidden mb-12 shadow-2xl flex items-end">
        <div className="absolute inset-0 bg-linear-to-br from-purple-900 via-zinc-950 to-black">
          {playlist?.bannerImageKey && (
            <img 
              src={bannerUrl} 
              className="w-full h-full object-cover opacity-60" 
              alt=""
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent z-10" />
        </div>

        <div className="relative z-20 p-12 flex items-center gap-10">
          <div className="w-48 h-48 bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden flex items-center justify-center">
            {playlist?.coverImageKey ? (
              <img src={coverUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <ListMusic className="text-zinc-700" size={64} />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 italic">
                {isUserPlaylist ? "USER BUFFER" : "SYSTEM PLAYLIST"}
              </span>
              <div className="h-1 w-8 bg-indigo-500 rounded-full" />
            </div>
            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
              {playlist?.title || playlist?.name}
            </h1>
            <p className="text-zinc-500 text-sm font-medium opacity-80 max-w-xl">
              {playlist?.description ||
                "A curated frequency of synchronized audio transients."}
            </p>

            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={handleStreamAll}
                disabled={songs.length === 0}
                className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Play fill="black" size={14} />
                Stream All
              </button>

              {isUserPlaylist && (
                <button
                  onClick={() => {
                    if (confirm("Delete this cluster permanently?"))
                      deletePlaylist.mutate();
                  }}
                  className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Playlist Grid */}
      <section>
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
              Tracklist
            </h2>
            <div className="h-px w-24 bg-linear-to-r from-purple-500 to-transparent" />
          </div>
          <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-black uppercase tracking-widest italic group cursor-pointer hover:text-white transition-colors">
            <Clock size={14} />
            <span>{songs.length} Synchronized Tracks</span>
          </div>
        </div>

        {songs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
            {songs.map((song: any) => (
              <SongCard
                key={song.id}
                song={song}
                onRemove={
                  isUserPlaylist ? () => removeSong.mutate(song.id) : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-[3rem] text-zinc-600 font-black uppercase italic tracking-widest">
            No Frequencies Uploaded to this Cluster
          </div>
        )}
      </section>
    </div>
  );
}
