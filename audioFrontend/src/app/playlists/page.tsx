"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { musicApi } from "@/lib/api";
import Link from "next/link";
import { ListMusic, Library, Plus, Sparkles } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import { playerStore } from "@/store/player.store";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function PlaylistsPage() {
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: userPlaylistsResponse, isLoading: isUserLoading } = useQuery({
    queryKey: ["user-playlists", systemUser?.id],
    queryFn: () => musicApi.users.getPlaylists(),
    enabled: !!systemUser?.id,
  });

  const { data: systemPlaylistsResponse, isLoading: isSystemLoading } =
    useQuery({
      queryKey: ["system-playlists"],
      queryFn: () => musicApi.playlists.list(1, 20),
    });

  const userPlaylists = userPlaylistsResponse?.data?.data || [];
  const systemPlaylists = systemPlaylistsResponse?.data?.data || [];

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !systemUser?.id) return;
    try {
      await musicApi.users.createPlaylist(newPlaylistName);
      toast.success("Frequency Allocated", {
        description: `Playlist "${newPlaylistName}" created successfully.`,
      });
      setNewPlaylistName("");
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
    } catch (err) {
      toast.error("Allocation Error", {
        description: "Failed to create frequency buffer.",
      });
    }
  };

  if (!isMounted) return null;

  return (
    <div className="px-10 pb-20">
      <header className="relative h-[300px] rounded-[3rem] overflow-hidden mb-12 shadow-2xl flex items-end">
        <div className="absolute inset-0 bg-linear-to-br from-violet-950 via-zinc-950 to-black">
          <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent z-10" />
        </div>

        <div className="relative z-20 p-12 flex items-center gap-10">
          <div className="w-48 h-48 bg-violet-600 rounded-[2.5rem] shadow-2xl shadow-violet-500/20 border border-white/10 flex items-center justify-center">
            <Library className="text-white" size={64} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400 italic">
                Curated Clusters
              </span>
              <div className="h-1 w-8 bg-violet-500 rounded-full" />
            </div>
            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
              Playlists
            </h1>
            <p className="text-zinc-500 text-sm font-medium opacity-80 max-w-xl">
              Synchronized collections of audio transients organized by mood,
              genre, and frequency.
            </p>
          </div>
        </div>
      </header>

      {/* User Playlists */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
              Your Transients
            </h2>
            <div className="h-px w-24 bg-linear-to-r from-violet-500 to-transparent" />
          </div>
          <button
            onClick={() =>
              systemUser
                ? setIsCreateModalOpen(true)
                : toast.error("Auth Required", {
                    description: "Sign in to create playlists.",
                  })
            }
            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest italic transition-all"
          >
            <Plus size={14} />
            <span>Initialize New Cluster</span>
          </button>
        </div>

        {isUserLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square bg-zinc-900/40 border border-white/5 rounded-[3rem] animate-pulse"
              />
            ))}
          </div>
        ) : userPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
            {userPlaylists.map((playlist: any) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-zinc-600 border-2 border-dashed border-zinc-900 rounded-[4rem] font-bold italic tracking-tight uppercase">
            {systemUser
              ? "NO PERSONAL CLUSTERS INITIALIZED"
              : "LOGIN TO ACCESS PERSONAL CLUSTERS"}
          </div>
        )}
      </section>

      {/* System Playlists */}
      <section>
        <div className="flex items-center gap-6 mb-12 px-2">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
            System Algorithms
          </h2>
          <div className="h-px flex-1 bg-linear-to-r from-violet-500/50 to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
          {systemPlaylists.map((playlist: any) => (
            <PlaylistCard key={playlist.id} playlist={playlist} isSystem />
          ))}
        </div>
      </section>

      {/* Create Playlist Modal */}
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
                Initialize Cluster
              </h2>
              <input
                autoFocus
                type="text"
                placeholder="Cluster Name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl text-white font-bold italic tracking-tight mb-8 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
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
                  className="flex-1 py-4 bg-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-500/20 hover:bg-violet-400 transition-all"
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

import { getImageUrl } from "@/lib/image-utils";

function PlaylistCard({
  playlist,
  isSystem = false,
}: {
  playlist: any;
  isSystem?: boolean;
}) {
  const coverUrl = getImageUrl(playlist.coverImageKey, { 
    width: 400, 
    height: 400, 
    focus: "auto",
    aspectRatio: "1-1"
  });

  return (
    <Link href={`/playlists/${playlist.id}${isSystem ? "?type=system" : "?type=user"}`} className="group relative">
      <div className="aspect-square bg-zinc-900 rounded-[3rem] border border-white/5 overflow-hidden mb-6 group-hover:border-violet-500/50 transition-all duration-500 shadow-xl group-hover:shadow-violet-500/10 relative">
        <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-950 flex items-center justify-center group-hover:from-violet-900/40 group-hover:to-zinc-950 transition-colors duration-700">
          {playlist.coverImageKey ? (
            <img 
              src={coverUrl} 
              alt={playlist.name || playlist.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <ListMusic
              className="text-zinc-800 group-hover:text-violet-400/30 transition-colors"
              size={100}
            />
          )}
        </div>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-16 h-16 bg-white rounded-4xl flex items-center justify-center text-black shadow-2xl scale-90 group-hover:scale-100 transition-transform">
            <Sparkles size={24} className="fill-black" />
          </div>
        </div>
      </div>
      <div className="px-2">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-black italic uppercase tracking-tighter text-zinc-200 group-hover:text-white transition-colors truncate">
            {playlist.name || playlist.title}
          </h3>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">
          {isSystem ? "System Curated" : "User Frequency"}
        </p>
      </div>
    </Link>
  );
}
