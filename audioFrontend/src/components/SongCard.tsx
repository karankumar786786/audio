import { motion } from "framer-motion";
import { Play, Heart, Plus, X } from "lucide-react";
import { type Song } from "../lib/api";
import { playerActions, playerStore } from "../store/player.store";
import { mapToPlayerSong } from "../lib/player-utils";
import { useStore } from "@tanstack/react-store";
import { toast } from "sonner";
import { useState } from "react";
import { PlaylistPickerModal } from "./PlaylistPickerModal";
import { getImageUrl } from "../lib/image-utils";

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
      toast.error("Sign in required", {
        description: "Please sign in to save songs to your library.",
      });
      return;
    }

    try {
      await playerActions.toggleFavourite(song.id);
      if (isFavourite) {
        toast.success("Removed from favourites", {
          description: `"${song.title}" removed from your collection.`,
        });
      } else {
        toast.success("Added to favourites", {
          description: `"${song.title}" added to your collection.`,
        });
      }
    } catch (err) {
      toast.error("Error", {
        description: "Failed to update favourites.",
      });
    }
  };

  const handleOpenPlaylistPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!systemUser?.id) {
      toast.error("Sign in required", {
        description: "Please sign in to add songs to playlists.",
      });
      return;
    }
    setIsPlaylistModalOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
        className="bg-zinc-900/20 hover:bg-zinc-900/50 border border-white/[0.04] hover:border-white/[0.08] transition-all p-3.5 rounded-[1.5rem] group cursor-pointer relative"
      >
        <div className="aspect-square bg-zinc-800 rounded-[1.2rem] mb-3.5 relative shadow-xl overflow-hidden ring-1 ring-white/[0.04]">
          <img
            src={getImageUrl(song.imageKey, {
              width: 400,
              height: 400,
              focus: "auto",
              aspectRatio: "1-1",
            })}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            alt={song.title}
            loading={priority ? "eager" : "lazy"}
          />

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlay}
              className="w-12 h-12 bg-indigo-500 hover:bg-white hover:text-black rounded-full shadow-2xl flex items-center justify-center text-white transition-colors"
            >
              <Play fill="currentColor" size={20} className="ml-0.5" />
            </motion.button>
          </div>
        </div>

        <div className="space-y-1 px-1">
          <h3 className="font-black text-zinc-100 truncate text-[0.85rem] uppercase italic tracking-tight">
            {song.title}
          </h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate group-hover:text-indigo-400 transition-colors italic">
            {song.artistName}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="absolute top-5 right-5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 duration-300">
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="w-8 h-8 rounded-xl bg-red-500/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-lg"
              title="Remove"
            >
              <X size={14} />
            </button>
          )}
          <button
            onClick={handleToggleFavourite}
            className={`w-8 h-8 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-colors shadow-lg ${
              isFavourite
                ? "text-red-500"
                : "text-zinc-400 hover:text-red-500"
            }`}
          >
            <Heart size={14} fill={isFavourite ? "currentColor" : "none"} />
          </button>
          <button
            onClick={handleOpenPlaylistPicker}
            className="w-8 h-8 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-lg"
          >
            <Plus size={14} />
          </button>
        </div>
      </motion.div>

      {/* Portal: Modal is OUTSIDE the transformed card so fixed positioning works */}
      <PlaylistPickerModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        songId={song.id}
        songTitle={song.title}
      />
    </>
  );
}
