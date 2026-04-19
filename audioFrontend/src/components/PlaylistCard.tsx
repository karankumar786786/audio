import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { type Playlist } from "../lib/api";
import { getImageUrl } from "../lib/image-utils";

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <Link
      href={`/playlists/${playlist.id}?type=system`}
      className="flex-none w-[180px] group relative space-y-4 cursor-pointer "
    >
      <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-white/5 shadow-2xl  ">
        <img
          src={getImageUrl(playlist.coverImageKey || playlist.bannerImageKey, {
            width: 400,
            height: 400,
            focus: "auto",
            aspectRatio: "1-1",
          })}
          alt={playlist.name}
          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 transition-transform">
            <Play fill="black" size={24} className="text-black" />
          </div>
        </div>
      </div>
      <div className="space-y-1.5 px-2">
        <h3 className="font-black text-white truncate group-hover:text-primary transition-colors text-sm uppercase italic tracking-tighter">
          {playlist.name}
        </h3>
        <p className="text-[10px] text-zinc-500 truncate font-black uppercase tracking-[0.15em] italic">
          {playlist.description || "Collection"}
        </p>
      </div>
    </Link>
  );
}
