"use client";

import { motion } from "framer-motion";
import { Play, MoreVertical, Heart } from "lucide-react";
import { type Song } from "../lib/api";
import { playerActions } from "../store/player.store";

interface SongCardProps {
  song: Song;
  priority?: boolean;
}

export function SongCard({ song, priority }: SongCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-zinc-900/40 hover:bg-zinc-900 border border-white/5 transition-all p-4 rounded-3xl group cursor-pointer relative"
    >
      <div className="aspect-square bg-zinc-800 rounded-2xl mb-4 relative shadow-2xl overflow-hidden">
        <img 
          src={`https://ik.imagekit.io/zaa6pbi9f${song.imageKey}`} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          alt={song.title}
          loading={priority ? "eager" : "lazy"}
        />
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); playerActions.play(song); }}
              className="w-14 h-14 bg-indigo-500 rounded-full shadow-2xl flex items-center justify-center text-black"
            >
                <Play fill="black" size={28} className="ml-1" />
            </motion.button>
        </div>
      </div>

      <div className="space-y-1 pr-8">
        <h3 className="font-bold text-white mb-0.5 truncate text-sm">{song.title}</h3>
        <p className="text-xs text-zinc-500 line-clamp-1 hover:text-indigo-400 transition-colors">{song.artistName}</p>
      </div>

      {/* Quick Actions */}
      <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
          <button className="p-2 rounded-full bg-black/40 backdrop-blur-md text-zinc-400 hover:text-red-500 transition-colors">
            <Heart size={16} />
          </button>
          <button className="p-2 rounded-full bg-black/40 backdrop-blur-md text-zinc-400 hover:text-white transition-colors">
            <MoreVertical size={16} />
          </button>
      </div>
    </motion.div>
  );
}
