"use client";

import { useQuery } from "@tanstack/react-query";
import { musicApi } from "@/lib/api";
import Link from "next/link";
import { ListMusic, Sparkles, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { getImageUrl } from "@/lib/image-utils";

export default function PlaylistsPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: systemPlaylistsResponse, isLoading: isSystemLoading } =
    useQuery({
      queryKey: ["system-playlists"],
      queryFn: () => musicApi.playlists.list(1, 20),
    });

  const systemPlaylists = systemPlaylistsResponse?.data?.data || [];

  if (!isMounted) return null;

  return (
    <div className="px-10 pb-20 pt-8">
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
