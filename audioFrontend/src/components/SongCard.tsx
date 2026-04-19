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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-effect hover-scale p-3.5 rounded-[1.8rem] group cursor-pointer relative overflow-hidden"
      >
        <div className="aspect-square bg-zinc-900 rounded-[1.4rem] mb-4 relative shadow-2xl overflow-hidden ring-1 ring-white/[0.04]">
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
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[4px]">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlay}
              className="w-14 h-14 bg-primary text-black rounded-full shadow-2xl flex items-center justify-center hover:brightness-110 transition-all"
            >
              <Play fill="black" size={24} className="ml-1" />
            </motion.button>
          </div>
        </div>

        <div className="space-y-1.5 px-1.5 pb-1">
          <h3 className="font-black text-white truncate text-[0.9rem] uppercase italic tracking-tighter text-glow-green">
            {song.title}
          </h3>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] truncate group-hover:text-primary transition-colors italic">
            {song.artistName}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="absolute top-5 right-5 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-3 group-hover:translate-x-0 duration-300">
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center hover:brightness-110 transition-all shadow-2xl"
              title="Remove"
            >
              <X size={15} />
            </button>
          )}
          <button
            onClick={handleToggleFavourite}
            className={`w-9 h-9 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all shadow-2xl ${
              isFavourite
                ? "text-primary border-primary/20"
                : "text-zinc-400 hover:text-primary"
            }`}
          >
            <Heart size={15} fill={isFavourite ? "currentColor" : "none"} />
          </button>
          <button
            onClick={handleOpenPlaylistPicker}
            className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-primary transition-all shadow-2xl"
          >
            <Plus size={15} />
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
