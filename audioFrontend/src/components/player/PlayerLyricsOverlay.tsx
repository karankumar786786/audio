import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2 } from "lucide-react";
import { TranscriptionEntry } from "./hooks/useLyrics";

interface PlayerLyricsOverlayProps {
  currentCaption: TranscriptionEntry | null;
  localTime: number;
}

export const PlayerLyricsOverlay: React.FC<PlayerLyricsOverlayProps> = ({
  currentCaption,
  localTime,
}) => {
  return (
    <div className="flex-1 overflow-hidden relative z-10 px-6 flex flex-col justify-center lyrics-mask min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center py-1">
        <AnimatePresence mode="wait">
          {currentCaption ? (
            <motion.div
              key={currentCaption.start_time_seconds}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center px-2 w-full"
            >
              {currentCaption.words.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-x-[5px] gap-y-1.5">
                  {currentCaption.words.map((word, idx) => {
                    const isActive = localTime >= word.start && localTime <= word.end;
                    const isPast = localTime > word.end;
                    return (
                      <motion.span
                        key={idx}
                        animate={{
                          color: isActive
                            ? "#ffffff"
                            : isPast
                            ? "rgba(255,255,255,0.4)"
                            : "rgba(255,255,255,0.12)",
                          scale: isActive ? 1.06 : 1,
                        }}
                        transition={{ duration: 0.12 }}
                        className={`text-lg font-black italic tracking-tight leading-relaxed ${
                          isActive ? "text-glow-green" : ""
                        }`}
                      >
                        {word.text}
                      </motion.span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-lg font-black italic tracking-tight text-white/80 leading-relaxed text-glow-green">
                  {currentCaption.transcript}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <Mic2 className="text-zinc-800" size={20} />
              <p className="text-[9px] font-bold text-zinc-800 uppercase tracking-[0.15em]">
                Lyrics
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
