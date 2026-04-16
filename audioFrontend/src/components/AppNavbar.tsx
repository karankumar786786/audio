"use client";

import { Search, Bell, Settings, User, Sparkles, X, History } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { musicApi } from "@/lib/api";
import { playerStore } from "@/store/player.store";
import { useStore } from "@tanstack/react-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Mic2, Play, Music, ListMusic, Loader2 } from "lucide-react";
import { playerActions } from "@/store/player.store";
import { mapToPlayerSong } from "@/lib/player-utils";

export function AppNavbar() {
  const { user, loginWithRedirect, logout, isAuthenticated } = useAuth0();
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch History
  const { data: searchHistory } = useQuery({
    queryKey: ["search-history", systemUser?.id],
    queryFn: () => musicApi.users.getSearchHistory(systemUser!.id, 1, 5),
    enabled: !!systemUser?.id && isFocused && !query.trim(),
  });

  // Fetch Live Results
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["active-search", debouncedQuery],
    queryFn: () => musicApi.search.unified(debouncedQuery),
    enabled: isFocused && !!debouncedQuery.trim(),
  });

  const saveHistory = useMutation({
    mutationFn: (text: string) => musicApi.users.saveSearchHistory(systemUser!.id, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["search-history"] }),
  });

  const clearHistory = useMutation({
    mutationFn: () => musicApi.users.clearSearchHistory(systemUser!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["search-history"] }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (systemUser?.id) saveHistory.mutate(query.trim());
    // In-navbar search: focus remains, results shown dynamically
  };

  const handleRecentClick = (text: string) => {
    setQuery(text);
    if (systemUser?.id) saveHistory.mutate(text);
  };

  const handlePlaySong = (song: any) => {
    playerActions.play(mapToPlayerSong(song));
    setIsFocused(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full px-10 py-6 flex items-center justify-between pointer-events-none">
      {/* Search Input Container */}
      <div className="flex items-center gap-6 pointer-events-auto relative" ref={menuRef}>
        <form onSubmit={handleSearch} className="relative group overflow-hidden rounded-2xl w-96">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search for tracks, artists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-2xl py-3 pl-14 pr-8 text-xs font-bold focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none w-full text-white placeholder-zinc-500 shadow-2xl"
          />
        </form>

        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-4 w-[480px] bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
            >
              {!query.trim() ? (
                /* RECENT SEARCHES */
                <>
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Recent Searches</span>
                    {systemUser && (
                      <button 
                        onClick={() => clearHistory.mutate()}
                        className="text-[10px] font-black text-indigo-400 hover:text-white transition-colors"
                      >
                        CLEAR ALL
                      </button>
                    )}
                  </div>
                  <div className="p-2">
                    {!systemUser ? (
                      <div className="p-4 text-center text-zinc-600 text-[10px] font-bold italic">Sign in to sync frequencies.</div>
                    ) : searchHistory?.data?.data.length === 0 ? (
                      <div className="p-4 text-center text-zinc-600 text-[10px] font-bold italic">Memory empty.</div>
                    ) : (
                      searchHistory?.data?.data.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => handleRecentClick(item.searchedText)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all text-left group"
                        >
                          <History size={14} className="text-zinc-600 group-hover:text-indigo-400" />
                          <span className="text-xs font-medium text-zinc-300 group-hover:text-white truncate">{item.searchedText}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                /* LIVE SEARCH RESULTS */
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Live Results</span>
                    {isSearching && <Loader2 size={12} className="text-indigo-400 animate-spin" />}
                  </div>

                  <div className="p-2 space-y-1">
                    {/* Songs */}
                    {searchResults?.data?.songs?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="px-3 py-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Tracks</h4>
                        {searchResults.data.songs.map((song: any) => (
                          <button
                            key={song.id}
                            onClick={() => handlePlaySong(song)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all text-left group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 overflow-hidden flex-shrink-0 border border-white/5">
                              <img src={`https://ik.imagekit.io/zaa6pbi9f${song.imageKey}?tr=w-100,h-100`} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{song.title}</p>
                              <p className="text-[10px] text-zinc-500 font-medium truncate uppercase tracking-wider">{song.artistName}</p>
                            </div>
                            <Play size={14} className="text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:text-indigo-400 transition-all mr-2" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Artists */}
                    {searchResults?.data?.artists?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="px-3 py-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Nodes</h4>
                        {searchResults.data.artists.map((artist: any) => (
                          <button
                            key={artist.id}
                            onClick={() => { router.push(`/artists/${artist.id}`); setIsFocused(false); }}
                            className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all text-left group"
                          >
                            <div className="w-10 h-10 rounded-full bg-zinc-900 overflow-hidden flex-shrink-0 border border-white/5 flex items-center justify-center">
                              {artist.coverImageKey ? (
                                <img src={`https://ik.imagekit.io/zaa6pbi9f${artist.coverImageKey}?tr=w-100,h-100`} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <Mic2 size={16} className="text-zinc-700" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{artist.name}</p>
                              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic tracking-wider">Artist</p>
                            </div>
                            <Sparkles size={12} className="text-indigo-400 mr-2" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Playlists */}
                    {searchResults?.data?.playlists?.length > 0 && (
                      <div>
                        <h4 className="px-3 py-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Clusters</h4>
                        {searchResults.data.playlists.map((playlist: any) => (
                          <button
                            key={playlist.id}
                            onClick={() => { router.push(`/playlists/${playlist.id}`); setIsFocused(false); }}
                            className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all text-left group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 overflow-hidden flex-shrink-0 border border-white/5 flex items-center justify-center">
                              {playlist.coverImageKey ? (
                                <img src={`https://ik.imagekit.io/zaa6pbi9f${playlist.coverImageKey}?tr=w-100,h-100`} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <ListMusic size={16} className="text-zinc-700" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{playlist.name}</p>
                              <p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Playlist</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {debouncedQuery.trim() && !isSearching && (!searchResults?.data?.songs?.length && !searchResults?.data?.artists?.length && !searchResults?.data?.playlists?.length) && (
                      <div className="p-8 text-center bg-white/5 rounded-2xl m-2">
                         <Search size={24} className="mx-auto mb-3 text-zinc-700 opacity-50" />
                         <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">No frequencies matching "{query}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User & Actions */}
      <div className="flex items-center gap-4 pointer-events-auto">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="hidden md:flex items-center gap-2 bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-2xl px-5 py-3 shadow-2xl cursor-pointer"
        >
          <Sparkles className="text-indigo-400" size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">High Fidelity Enabled</span>
        </motion.div>

        <button className="w-12 h-12 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-2xl">
          <Bell size={20} />
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
             <motion.div 
              whileHover={{ scale: 1.05 }}
              onClick={() => logout()}
              className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-transparent hover:border-red-500 transition-all cursor-pointer shadow-2xl ring-4 ring-black group relative"
             >
               <img src={user?.picture || "https://avatar.vercel.sh/me"} className="w-full h-full object-cover" alt="Profile" />
               <div className="absolute inset-0 bg-red-500/80 items-center justify-center hidden group-hover:flex">
                  <X size={20} className="text-white" />
               </div>
             </motion.div>
          </div>
        ) : (
          <button 
            onClick={() => loginWithRedirect()}
            className="px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-2xl flex items-center gap-2"
          >
            <User size={14} />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
