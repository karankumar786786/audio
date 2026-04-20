"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { musicApi } from "@/lib/api";
import Link from "next/link";
import { ListMusic, Library, Plus, Sparkles, ChevronRight, Music } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import { playerStore } from "@/store/player.store";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/image-utils";

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

      {/* User Playlists */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
              Your Playlists
            </h2>
            <div className="h-px w-24 bg-linear-to-r from-primary to-transparent" />
          </div>
          <button
            onClick={() =>
              systemUser
                ? setIsCreateModalOpen(true)
                : toast.error("Auth Required", {
                    description: "Sign in to create playlists.",
                  })
            }
            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all shadow-xl shadow-black/50"
          >
            <Plus size={14} strokeWidth={3} />
            <span>Create</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {isUserLoading ? (
            [1, 2].map((i) => (
              <div
                key={i}
                className="h-28 bg-zinc-900/40 border border-white/5 rounded-3xl animate-pulse"
              />
            ))
          ) : userPlaylists.length > 0 ? (
            userPlaylists.map((playlist: any) => (
              <PlaylistRow key={playlist.id} playlist={playlist} />
            ))
          ) : (
            <div className="py-20 text-center text-zinc-600 border-2 border-dashed border-zinc-900 rounded-[4rem] font-bold italic tracking-tight uppercase">
              {systemUser
                ? "NO PERSONAL CLUSTERS INITIALIZED"
                : "LOGIN TO ACCESS PERSONAL CLUSTERS"}
            </div>
          )}
        </div>
      </section>

      {/* System Playlists */}
      <section>
        <div className="flex items-center gap-6 mb-8 px-2">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
            Playlists
          </h2>
          <div className="h-px flex-1 bg-linear-to-r from-violet-500/50 to-transparent" />
        </div>

        <div className="flex flex-col gap-2">
          {isSystemLoading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-zinc-900/40 border border-white/5 rounded-3xl animate-pulse"
              />
            ))
          ) : (
            systemPlaylists.map((playlist: any) => (
              <PlaylistRow key={playlist.id} playlist={playlist} isSystem />
            ))
          )}
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
                Create Playlist
              </h2>
              <input
                autoFocus
                type="text"
                placeholder="Cluster Name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl text-white font-bold italic tracking-tight mb-8 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
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
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-500/20 hover:bg-primary transition-all"
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

function PlaylistRow({
  playlist,
  isSystem = false,
}: {
  playlist: any;
  isSystem?: boolean;
}) {
  const coverUrl = getImageUrl(playlist.coverImageKey, { 
    width: 300, 
    height: 300, 
    focus: "auto",
    aspectRatio: "1-1"
  });

  return (
    <Link 
      href={`/playlists/${playlist.id}${isSystem ? "?type=system" : "?type=user"}`} 
      className="group flex items-center gap-8 p-5 rounded-[2.5rem]   hover:bg-white/3 border border-transparent hover:border-white/5 transition-all duration-500"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
        {playlist.coverImageKey ? (
          <img 
            src={coverUrl} 
            alt={playlist.name || playlist.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-500/10 text-primary">
            <ListMusic className="opacity-40" size={32} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Sparkles size={20} className="text-white fill-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors truncate">
            {playlist.name || playlist.title}
          </h3>
        </div>
        <p className="text-zinc-500 text-xs font-medium italic opacity-60 group-hover:opacity-100 transition-opacity line-clamp-1 max-w-2xl">
          {playlist.description || ""}
        </p>
      </div>

      <div className="shrink-0 flex items-center gap-6 pr-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:bg-primary group-hover:text-black group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all duration-300">
           <ChevronRight size={24} strokeWidth={3} />
        </div>
      </div>
    </Link>
  );
}
