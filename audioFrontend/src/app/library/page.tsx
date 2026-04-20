"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { musicApi, type Song, type Playlist } from "../../lib/api";
import { SongCard } from "../../components/SongCard";
import { useStore } from "@tanstack/react-store";
import { playerStore, playerActions } from "../../store/player.store";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Heart,
  Clock,
  ListMusic,
  Plus,
  Music,
  Library as LibraryIcon,
  Search,
  Trash2,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { mapListToPlayerSongs } from "../../lib/player-utils";
import Link from "next/link";

type Tab = "favourites" | "history" | "playlists";

export default function LibraryPage() {
  const queryClient = useQueryClient();
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const [activeTab, setActiveTab] = useState<Tab>("favourites");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: favourites, isLoading: isFavLoading } = useQuery({
    queryKey: ["library-favourites", systemUser?.id],
    queryFn: () => musicApi.users.getFavourites(),
    enabled: !!systemUser?.id && activeTab === "favourites",
  });

  const { data: history, isLoading: isHistLoading } = useQuery({
    queryKey: ["library-history", systemUser?.id],
    queryFn: () => musicApi.users.getHistory(),
    enabled: !!systemUser?.id && activeTab === "history",
  });

  const {
    data: userPlaylists,
    isLoading: isPlaylistsLoading,
    refetch: refetchPlaylists,
  } = useQuery({
    queryKey: ["library-playlists", systemUser?.id],
    queryFn: () => musicApi.users.getPlaylists(),
    enabled: !!systemUser?.id && activeTab === "playlists",
  });

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !systemUser?.id) return;
    try {
      await musicApi.users.createPlaylist(newPlaylistName);
      toast.success("Frequency Allocated", {
        description: `Playlist "${newPlaylistName}" created successfully.`,
      });
      setNewPlaylistName("");
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["library-playlists"] });
    } catch (err) {
      toast.error("Allocation Error", {
        description: "Failed to create frequency buffer.",
      });
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await musicApi.users.deletePlaylist(playlistId);
      toast.success("Memory Purged", { description: "User playlist deleted." });
      queryClient.invalidateQueries({ queryKey: ["library-playlists"] });
    } catch (err) {
      toast.error("Defragmentation Failed", {
        description: "Failed to remove playlist memory.",
      });
    }
  };

  const handleStreamCollection = (songs: Song[]) => {
    if (!songs || songs.length === 0) return;
    const playerSongs = mapListToPlayerSongs(songs);
    playerActions.setQueue(playerSongs);
    playerActions.play(playerSongs[0]);
    toast.success("Collection Streamed", {
      description: `Syncing ${songs.length} audio transients.`,
    });
  };

  if (!isMounted) {
    return null; // Wait for hydration before conditionally rendering auth views
  }

  if (!systemUser) {
    return (
      <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center p-10 text-center">
        <div className="w-32 h-32 bg-zinc-900 rounded-[3rem] flex items-center justify-center mb-10 border border-white/5 shadow-2xl">
          <LibraryIcon className="text-zinc-700" size={48} />
        </div>
        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4">
          Frequency Required
        </h1>
        <p className="text-zinc-500 max-w-sm font-medium italic">
          Establishing a secure connection is mandatory to access your personal
          frequency vault.
        </p>
      </div>
    );
  }

  return (
    <div className="px-10 pb-20 pt-10">
      {/* Library Header */}
      <div className="flex items-center justify-between mb-20 px-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20">
              <LibraryIcon size={24} className="text-black" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">
              User Repository
            </span>
          </div>
          <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
            Your Library
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {activeTab === "favourites" &&
            (favourites?.data?.data?.length || 0) > 0 && (
              <button
                onClick={() => handleStreamCollection(favourites!.data.data)}
                className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl"
              >
                <Play fill="black" size={16} />
                Stream Favs
              </button>
            )}
          {activeTab === "history" &&
            (history?.data?.data?.length || 0) > 0 && (
              <button
                onClick={() => handleStreamCollection(history!.data.data)}
                className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl"
              >
                <Play fill="black" size={16} />
                Resume All
              </button>
            )}
          {activeTab === "playlists" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-2xl"
            >
              <Plus size={16} />
              New Buffer
            </motion.button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-12 mb-16 border-b border-white/5 px-6">
        {[
          { id: "favourites", label: "Favourites", icon: Heart },
          { id: "history", label: "History", icon: Clock },
          { id: "playlists", label: "Playlists", icon: ListMusic },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 pb-6 text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab.id
                ? "text-white"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            <tab.icon
              size={14}
              className={activeTab === tab.id ? "text-primary" : ""}
            />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === "favourites" && (
          <div>
            {isFavLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-zinc-900/40 rounded-[3rem] animate-pulse"
                  />
                ))}
              </div>
            ) : (favourites?.data?.data?.length || 0) === 0 ? (
              <div className="py-32 text-center text-zinc-600 font-bold italic border-2 border-dashed border-zinc-900 rounded-[3rem]">
                No captured frequencies in your repository.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                {favourites?.data?.data.map((song: Song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onRemove={() => {
                      playerActions.toggleFavourite(song.id).then(() => {
                        queryClient.invalidateQueries({
                          queryKey: ["library-favourites"],
                        });
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div>
            {isHistLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-zinc-900/40 rounded-[3rem] animate-pulse"
                  />
                ))}
              </div>
            ) : (history?.data?.data?.length || 0) === 0 ? (
              <div className="py-32 text-center text-zinc-600 font-bold italic border-2 border-dashed border-zinc-900 rounded-[3rem]">
                No playback logs found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                {history?.data?.data.map((song: Song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "playlists" && (
          <div>
            {isPlaylistsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-zinc-900/40 rounded-[3rem] animate-pulse"
                  />
                ))}
              </div>
            ) : (userPlaylists?.data?.data?.length || 0) === 0 ? (
              <div className="py-32 text-center text-zinc-600 font-bold italic border-2 border-dashed border-zinc-900 rounded-[3rem]">
                No custom frequency buffers initialized.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                {userPlaylists?.data?.data.map((playlist: Playlist) => (
                  <Link key={playlist.id} href={`/playlists/${playlist.id}?type=user`}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="bg-zinc-900/40 hover:bg-zinc-900/60 border border-white/5 p-8 rounded-[3rem] group relative cursor-pointer h-full"
                    >
                      <div className="w-full aspect-square bg-zinc-800 rounded-[2.5rem] mb-6 flex items-center justify-center shadow-2xl relative overflow-hidden ring-1 ring-white/5">
                        <ListMusic
                          className="text-zinc-700 group-hover:text-primary transition-colors"
                          size={64}
                        />
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (confirm("Purge this memory?"))
                                handleDeletePlaylist(playlist.id);
                            }}
                            className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all backdrop-blur-md border border-red-500/20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-black text-white italic tracking-tighter uppercase truncate px-2">
                        {playlist.name}
                      </h3>
                      <p className="text-[10px] font-black text-zinc-500 mt-1 uppercase tracking-widest px-2 italic">
                        User Frequency Buffer
                      </p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-3xl bg-black/40">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-white/10 p-10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)]"
            >
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8">
                Initialize Buffer
              </h2>
              <input
                autoFocus
                type="text"
                placeholder="Frequency Buffer Name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl text-white font-bold italic tracking-tight mb-8 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-900 text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlaylist}
                  className="flex-1 py-4 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 transition-all"
                >
                  Initialize
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
