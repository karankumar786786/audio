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
  className?: string;
}

export function SongCard({ song, priority, onRemove, className }: SongCardProps) {
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const favourites = useStore(playerStore, (s) => s.favourites);
  const currentSong = useStore(playerStore, (s) => s.currentSong);
  const isPlaying = useStore(playerStore, (s) => s.isPlaying);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  const isFavourite = favourites.has(song.id);
  const isActiveSong = currentSong?.id === song.id;

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

    toast.promise(playerActions.toggleFavourite(song.id), {
      loading: isFavourite ? "Removing from Favourites..." : "Adding to Favourites...",
      success: () => {
        return isFavourite ? "Removed from Favourites" : "Added to Favourites";
      },
      error: "Failed to update favourites",
      description: () => {
        return isFavourite 
          ? `"${song.title}" removed from your collection.`
          : `"${song.title}" added to your collection.`;
      }
    });
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
        onClick={handlePlay}
        className={`glass-effect hover-scale p-3.5 rounded-[1.8rem] group cursor-pointer relative overflow-hidden ${
          isActiveSong
            ? "ring-1 ring-primary/40 shadow-[0_0_20px_rgba(120,240,142,0.12)] bg-primary/2"
            : "hover:shadow-[0_0_25px_rgba(120,240,142,0.1)]"
        } ${className || ""}`}
      >
        <div className="aspect-square bg-zinc-900 rounded-[1.4rem] mb-4 relative shadow-2xl overflow-hidden ring-1 ring-white/4">
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

          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
          </div>

          {/* Micro Equalizer Overlay on playing song cover art */}
          {isActiveSong && isPlaying && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1.5 rounded-lg flex items-end gap-[3px] border border-white/5 z-20">
              <motion.div
                animate={{ height: [4, 12, 4] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                className="w-[2px] bg-primary rounded-full"
                style={{ height: 4 }}
              />
              <motion.div
                animate={{ height: [6, 16, 6] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="w-[2px] bg-primary rounded-full"
                style={{ height: 6 }}
              />
              <motion.div
                animate={{ height: [3, 9, 3] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="w-[2px] bg-primary rounded-full"
                style={{ height: 3 }}
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5 px-1.5 pb-1">
          <h3 className={`font-black truncate text-[0.9rem] uppercase italic tracking-tighter text-glow-green transition-colors duration-300 ${
            isActiveSong ? "text-primary" : "text-white"
          }`}>
            {song.title}
          </h3>
          <p className={`text-[10px] font-black uppercase tracking-[0.15em] truncate transition-colors italic ${
            isActiveSong ? "text-primary/70" : "text-zinc-500 group-hover:text-primary"
          }`}>
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
