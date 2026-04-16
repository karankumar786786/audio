import { motion } from "framer-motion";
import { Play, MoreVertical, Heart, Plus, X } from "lucide-react";
import { musicApi, type Song } from "../lib/api";
import { playerActions, playerStore } from "../store/player.store";
import { mapToPlayerSong } from "../lib/player-utils";
import { useStore } from "@tanstack/react-store";
import { toast } from "sonner";
import { useState } from "react";
import { PlaylistPickerModal } from "./PlaylistPickerModal";

interface SongCardProps {
  song: Song;
  priority?: boolean;
  onRemove?: () => void;
}

export function SongCard({ song, priority, onRemove }: SongCardProps) {
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const favourites = useStore(playerStore, (s) => s.favourites);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  
  const isFavourite = favourites.has(song.id);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playerActions.play(mapToPlayerSong(song));
  };

  const handleToggleFavourite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!systemUser?.id) {
      toast.error("Frequency Required", { description: "Please sign in to save transients to your library." });
      return;
    }

    try {
      await playerActions.toggleFavourite(song.id);
      if (isFavourite) {
        toast.success("Frequency Released", { description: `"${song.title}" removed from your collection.` });
      } else {
        toast.success("Memory Captured", { description: `"${song.title}" added to your collection.` });
      }
    } catch (err) {
      toast.error("Sync Error", { description: "Failed to update your archive." });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-zinc-900/30 hover:bg-zinc-900/60 border border-white/5 transition-all p-4 rounded-[2rem] group cursor-pointer relative"
    >
      <div className="aspect-square bg-zinc-800 rounded-3xl mb-4 relative shadow-2xl overflow-hidden ring-1 ring-white/5">
        <img 
          src={`https://ik.imagekit.io/zaa6pbi9f${song.imageKey}?tr=w-400,h-400,f-auto`} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          alt={song.title}
          loading={priority ? "eager" : "lazy"}
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: "#fff", color: "#000" }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlay}
              className="w-14 h-14 bg-indigo-500 rounded-full shadow-2xl flex items-center justify-center text-white transition-colors"
            >
                <Play fill="currentColor" size={24} className="ml-1" />
            </motion.button>
        </div>
      </div>

      <div className="space-y-1.5 px-1">
        <h3 className="font-black text-zinc-100 truncate text-[0.85rem] uppercase italic tracking-tight italic">{song.title}</h3>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate group-hover:text-indigo-400 transition-colors italic">{song.artistName}</p>
      </div>

      {/* Quick Actions */}
      <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300">
          {onRemove && (
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="w-8 h-8 rounded-xl bg-red-500/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-2xl"
              title="Remove from context"
            >
              <X size={14} />
            </button>
          )}
          <button 
            onClick={handleToggleFavourite}
            className={`w-8 h-8 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-colors shadow-2xl ${
              isFavourite ? "text-red-500 fill-red-500" : "text-zinc-400 hover:text-red-500"
            }`}
          >
            <Heart size={14} fill={isFavourite ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={() => setIsPlaylistModalOpen(true)}
            className="w-8 h-8 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-2xl"
          >
            <Plus size={14} />
          </button>
      </div>

      <PlaylistPickerModal 
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        songId={song.id}
        songTitle={song.title}
      />
    </motion.div>
  );
}
