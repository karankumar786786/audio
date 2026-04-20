import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface PlayerQualitySelectorProps {
  selectedQuality: "auto" | number;
  qualityTracks: any[];
  showQualityMenu: boolean;
  setShowQualityMenu: (show: boolean) => void;
  onSelectQuality: (quality: "auto" | number) => void;
}

export const PlayerQualitySelector: React.FC<PlayerQualitySelectorProps> = ({
  selectedQuality,
  qualityTracks,
  showQualityMenu,
  setShowQualityMenu,
  onSelectQuality,
}) => {
  return (
    <div className="relative group ml-1">
      <button
        onClick={() => setShowQualityMenu(!showQualityMenu)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all border ${
          showQualityMenu
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
        }`}
      >
        <span className="text-[9px] font-black italic tracking-wider">
          {selectedQuality === "auto" ? "HD" : `${Math.round((selectedQuality as number) / 1000)}K`}
        </span>
        <ChevronDown
          size={10}
          className={`transition-transform duration-300 ${showQualityMenu ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {showQualityMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-full left-0 mb-3 w-40 glass-effect-strong border border-white/10 rounded-2xl p-2 shadow-2xl z-[100]"
          >
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-1.5">
              Stream Quality
            </p>
            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
              <button
                onClick={() => {
                  onSelectQuality("auto");
                  setShowQualityMenu(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black italic transition-all mb-1 ${
                  selectedQuality === "auto"
                    ? "bg-primary text-black"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                AUTO
              </button>
              {qualityTracks.map((t: any) => (
                <button
                  key={t.bandwidth}
                  onClick={() => {
                    onSelectQuality(t.bandwidth);
                    setShowQualityMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black italic transition-all mb-1 ${
                    selectedQuality === t.bandwidth
                      ? "bg-primary text-black"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {Math.round(t.bandwidth / 1000)}K {t.label || ""}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
