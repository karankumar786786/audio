import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { type Artist } from "../lib/api";
import { getImageUrl } from "../lib/image-utils";

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      href={`/artists/${artist.id}`}
      className="flex-none w-[160px] group space-y-4 cursor-pointer text-center"
    >
      <div className="relative aspect-square overflow-hidden rounded-full bg-zinc-900 border border-white/5 mx-auto  transition-all duration-700 ">
        <img
          src={getImageUrl(artist.coverImageKey || artist.bannerImageKey, {
            width: 300,
            height: 300,
            focus: "auto",
            aspectRatio: "1-1",
          }) || "/placeholder-artist.png"}
          alt={artist.name}
          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
          <Play fill="white" className="text-white fill-white" size={32} />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-black text-white truncate group-hover:text-primary transition-colors text-[0.9rem] uppercase italic tracking-tighter">
          {artist.name}
        </h3>
        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black italic">
          Artist
        </p>
      </div>
    </Link>
  );
}
