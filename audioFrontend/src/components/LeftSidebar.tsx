"use client";

import {
  Home,
  Library,
  Heart,
  History,
  PlusSquare,
  Mic2,
  ListMusic,
  Users2,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { musicApi } from "@/lib/api";
import { useStore } from "@tanstack/react-store";
import { playerStore } from "@/store/player.store";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
  { icon: Home, label: "Home", href: "/home" },
  { icon: ListMusic, label: "Playlists", href: "/playlists" },
  { icon: Users2, label: "Artists", href: "/artists" },
];

const libraryItems = [
  { icon: Heart, label: "Favourites", href: "/favourites" },
  { icon: History, label: "History", href: "/history" },
];

export function LeftSidebar() {
  const pathname = usePathname();
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const queryClient = useQueryClient();
  const [hasMounted, setHasMounted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { data: playlistsResponse, isLoading } = useQuery({
    queryKey: ["user-playlists", systemUser?.id],
    queryFn: () => musicApi.users.getPlaylists(),
    enabled: !!systemUser?.id && hasMounted,
  });

  const userPlaylists = playlistsResponse?.data?.data || [];

  const handleCreatePlaylist = async () => {
    if (!newName.trim() || !systemUser?.id) return;
    try {
      await musicApi.users.createPlaylist(newName.trim());
      toast.success("Playlist Created", {
        description: `"${newName.trim()}" has been added to your library.`,
      });
      setNewName("");
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
    } catch {
      toast.error("Failed to create playlist.");
    }
  };

  return (
    <aside className="w-64 bg-zinc-950 border-r border-white/[0.04] flex flex-col h-screen fixed left-0 top-0 z-50 overflow-hidden">
      <div className="p-8 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 group cursor-pointer flex-shrink-0">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <Mic2 className="text-white fill-white" size={24} />
          </div>
          <span className="text-xl font-black tracking-tight italic text-white uppercase">
            AudioSync
          </span>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar pb-10">
          {/* Main Menu */}
          <section>
            <h3 className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4 italic">
              Discover
            </h3>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    pathname === item.href
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                      : "text-zinc-500 hover:text-white hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </section>

          {/* Library Section */}
          <section>
            <h3 className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4 italic">
              Library
            </h3>
            <nav className="space-y-1">
              {libraryItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    pathname === item.href
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                      : "text-zinc-500 hover:text-white hover:bg-white/[0.03] border border-transparent"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </section>

          {/* User Playlists */}
          <section suppressHydrationWarning>
            <div className="flex items-center justify-between px-4 mb-4">
              <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">
                Your Playlists
              </h3>
              {hasMounted && systemUser && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-zinc-600 hover:text-indigo-400 transition-colors"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {/* Inline Create Input */}
            <AnimatePresence>
              {isCreating && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 mb-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2 bg-zinc-900/80 border border-white/[0.06] rounded-xl p-1.5">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Playlist name..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreatePlaylist();
                        if (e.key === "Escape") {
                          setIsCreating(false);
                          setNewName("");
                        }
                      }}
                      className="flex-1 bg-transparent text-xs text-white font-bold px-2 py-1.5 outline-none placeholder-zinc-600"
                    />
                    <button
                      onClick={handleCreatePlaylist}
                      className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => { setIsCreating(false); setNewName(""); }}
                      className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <nav className="space-y-0.5">
              {!hasMounted || isLoading ? (
                <div className="space-y-2 px-2">
                  <div className="h-9 bg-zinc-900/30 rounded-xl animate-pulse" />
                  <div className="h-9 bg-zinc-900/30 rounded-xl animate-pulse" />
                  <div className="h-9 bg-zinc-900/30 rounded-xl animate-pulse" />
                </div>
              ) : userPlaylists.length > 0 ? (
                userPlaylists.map((playlist: any) => (
                  <Link
                    key={playlist.id}
                    href={`/playlists/${playlist.id}?type=user`}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all truncate ${
                      pathname === `/playlists/${playlist.id}`
                        ? "text-indigo-400 bg-indigo-500/[0.06]"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.02]"
                    }`}
                  >
                    <ListMusic size={14} className="flex-shrink-0 opacity-50" />
                    <span className="truncate">{playlist.name}</span>
                  </Link>
                ))
              ) : systemUser ? (
                <div className="px-4 py-3 text-[10px] text-zinc-700 font-bold italic">
                  No playlists yet
                </div>
              ) : (
                <div className="px-4 py-3 text-[10px] text-zinc-700 font-bold italic">
                  Sign in to see playlists
                </div>
              )}
            </nav>
          </section>
        </div>
      </div>
    </aside>
  );
}
