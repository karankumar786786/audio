"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { musicApi, type Playlist } from "@/lib/api";
import { playerStore } from "@/store/player.store";
import { useStore } from "@tanstack/react-store";
import { motion, AnimatePresence } from "framer-motion";
import { ListMusic, X, Plus, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface PlaylistPickerModalProps {
  songId: string;
  songTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaylistPickerModal({
  songId,
  songTitle,
  isOpen,
  onClose,
}: PlaylistPickerModalProps) {
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: playlists, isLoading } = useQuery({
    queryKey: ["user-playlists", systemUser?.id],
    queryFn: () => musicApi.users.getPlaylists(),
    enabled: !!systemUser?.id && isOpen,
  });

  const addToPlaylist = useMutation({
    mutationFn: (playlistId: string) =>
      musicApi.users.addSongToPlaylist(playlistId, songId),
    onSuccess: (_, playlistId) => {
      const playlist = playlists?.data?.data.find(
        (p: Playlist) => p.id === playlistId,
      );
      toast.success("Frequency Synced", {
        description: `Added "${songTitle}" to ${playlist?.name || "playlist"}.`,
      });
      onClose();
    },
    onError: () =>
      toast.error("Sync Conflict", {
        description: "Song already exists in this buffer or connection failed.",
      }),
  });

  const createAndAdd = useMutation({
    mutationFn: async () => {
      const res = await musicApi.users.createPlaylist(newName);
      await musicApi.users.addSongToPlaylist(
        res.data.id,
        songId,
      );
      return res.data;
    },
    onSuccess: (playlist) => {
      toast.success("Buffer Initialized", {
        description: `Created ${playlist.name} and synced "${songTitle}".`,
      });
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/40">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <ListMusic size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight">
                Sync to Buffer
              </h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic truncate max-w-[200px]">
                {songTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-600 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto no-scrollbar p-6 space-y-3">
          {isCreating ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <input
                autoFocus
                placeholder="New Buffer Name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl text-white font-bold italic tracking-tight outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-4 bg-zinc-900 text-zinc-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createAndAdd.mutate()}
                  className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20"
                >
                  Initialize
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Plus size={20} />
                </div>
                <span className="text-sm font-black text-white italic uppercase tracking-tighter">
                  Create New Buffer
                </span>
              </button>

              <div className="h-4" />

              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-zinc-900/40 rounded-2xl animate-pulse"
                  />
                ))
              ) : playlists?.data?.data.length === 0 ? (
                <div className="py-10 text-center text-zinc-600 font-bold italic text-xs">
                  No existing buffers found.
                </div>
              ) : (
                playlists?.data?.data.map((playlist: Playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => addToPlaylist.mutate(playlist.id)}
                    className="w-full flex items-center justify-between p-5 rounded-2xl border border-white/5 hover:bg-zinc-900 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-600 group-hover:text-white group-hover:bg-indigo-500/20 transition-all">
                        <ListMusic size={20} />
                      </div>
                      <span className="text-sm font-black text-white italic uppercase tracking-tighter">
                        {playlist.name}
                      </span>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-zinc-700 group-hover:text-white transition-colors"
                    />
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
