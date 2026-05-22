import React from "react";
import { motion } from "framer-motion";
import { useStore } from "@tanstack/react-store";
import { playerStore } from "../../store/player.store";

interface PlayerAlbumArtProps {
  songId: string;
  posterUrl: string;
  title: string;
}

export const PlayerAlbumArt: React.FC<PlayerAlbumArtProps> = ({ songId, posterUrl, title }) => {
  const isPlaying = useStore(playerStore, (s) => s.isPlaying);

  return (
    <div className="flex-none px-6 pt-2 pb-1 relative z-10">
      <div className="relative">
        {/* Glowing aura under the album art when playing */}
        {isPlaying && (
          <motion.div
            animate={{
              opacity: [0.15, 0.35, 0.15],
              scale: [0.96, 1.04, 0.96],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-2 bg-primary rounded-3xl blur-[35px] pointer-events-none"
          />
        )}
        <motion.div
          key={songId}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="aspect-square w-full rounded-3xl overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.5)] border border-white/6 relative z-10"
        >
          <img
            src={posterUrl}
            className="w-full h-full object-cover"
            alt={title}
          />
        </motion.div>
      </div>
    </div>
  );
};
