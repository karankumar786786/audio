import React from "react";
import { motion } from "framer-motion";

interface PlayerAlbumArtProps {
  songId: string;
  posterUrl: string;
  title: string;
}

export const PlayerAlbumArt: React.FC<PlayerAlbumArtProps> = ({ songId, posterUrl, title }) => {
  return (
    <div className="flex-none px-6 pt-2 pb-1 relative z-10">
      <motion.div
        key={songId}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="aspect-square w-full rounded-3xl overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.5)] border border-white/6"
      >
        <img
          src={posterUrl}
          className="w-full h-full object-cover"
          alt={title}
        />
      </motion.div>
    </div>
  );
};
