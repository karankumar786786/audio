import React from "react";
import { Heart, Plus } from "lucide-react";

interface PlayerTrackInfoProps {
  title: string;
  artistName: string;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  onAddToPlaylist: () => void;
}

export const PlayerTrackInfo: React.FC<PlayerTrackInfoProps> = ({
  title,
  artistName,
  isFavourite,
  onToggleFavourite,
  onAddToPlaylist,
}) => {
  return (
    <div className="flex-none px-6 py-1 relative z-10">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-white italic uppercase tracking-tight truncate leading-tight text-glow-green">
            {title}
          </h2>
          <p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.15em] italic mt-0.5 truncate">
            {artistName}
          </p>
        </div>
        <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
          <button
            onClick={onToggleFavourite}
            className={`p-2 rounded-xl transition-all ${
              isFavourite
                ? "text-primary shadow-2xl shadow-primary/20"
                : "text-zinc-600 hover:text-primary hover:bg-white/5"
            }`}
            title={isFavourite ? "Remove from favourites" : "Add to favourites"}
          >
            <Heart size={15} fill={isFavourite ? "currentColor" : "none"} />
          </button>
          <button
            onClick={onAddToPlaylist}
            className="p-2 text-zinc-600 hover:text-primary hover:bg-white/5 rounded-xl transition-all"
            title="Add to playlist"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
