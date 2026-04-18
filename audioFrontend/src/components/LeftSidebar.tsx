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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { musicApi } from "@/lib/api";
import { useStore } from "@tanstack/react-store";
import { playerStore } from "@/store/player.store";

const menuItems = [
  { icon: Home, label: "Home", href: "/home" },
  { icon: Library, label: "Playlists", href: "/playlists" },
  { icon: Users2, label: "Artists", href: "/artists" },
];

const libraryItems = [
  { icon: Heart, label: "Favourites", href: "/favourites" },
  { icon: History, label: "History", href: "/history" },
];

export function LeftSidebar() {
  const pathname = usePathname();
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { data: playlistsResponse, isLoading } = useQuery({
    queryKey: ["user-playlists", systemUser?.id],
    queryFn: () => musicApi.users.getPlaylists(),
    enabled: !!systemUser?.id && hasMounted,
  });

  const userPlaylists = playlistsResponse?.data?.data || [];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50 overflow-hidden">
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
            <h3 className="px-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 italic">
              Pulse
            </h3>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    pathname === item.href
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                      : "text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent"
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
            <h3 className="px-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 italic">
              Collection
            </h3>
            <nav className="space-y-1">
              {libraryItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    pathname === item.href
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                      : "text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </section>

          {/* User Playlists (Dynamic Content with Hydration Guard) */}
          <section suppressHydrationWarning>
            <div className="flex items-center justify-between px-4 mb-4">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">
                Playlists
              </h3>
              <Link href="/library?tab=playlists">
                <PlusSquare
                  size={14}
                  className="text-zinc-500 hover:text-white cursor-pointer transition-colors"
                />
              </Link>
            </div>

            <nav className="space-y-1">
              {/* 
                  HYDRATION GUARD: 
                  If we haven't mounted yet, we render a STATIC set of skeletons.
                  The server always renders this. The client always renders this first.
               */}
              {!hasMounted || isLoading ? (
                <div className="space-y-3">
                  <div className="h-10 mx-4 bg-zinc-900/50 rounded-xl animate-pulse" />
                  <div className="h-10 mx-4 bg-zinc-900/50 rounded-xl animate-pulse" />
                  <div className="h-10 mx-4 bg-zinc-900/50 rounded-xl animate-pulse" />
                </div>
              ) : userPlaylists.length > 0 ? (
                userPlaylists.map((playlist: any) => (
                  <Link
                    key={playlist.id}
                    href={`/playlists/${playlist.id}`}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-bold transition-all truncate ${
                      pathname === `/playlists/${playlist.id}`
                        ? "text-indigo-400"
                        : "text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    <ListMusic size={16} className="flex-shrink-0" />
                    <span className="truncate">{playlist.name}</span>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-3 text-[10px] text-zinc-600 font-bold italic uppercase tracking-wider">
                  No Transients Found
                </div>
              )}
            </nav>
          </section>
        </div>
      </div>
    </aside>
  );
}
