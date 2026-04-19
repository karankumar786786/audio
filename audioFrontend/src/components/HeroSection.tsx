import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";
import { type Song } from "../lib/api";
import { playerActions } from "../store/player.store";
import { mapToPlayerSong } from "../lib/player-utils";
import { getImageUrl } from "../lib/image-utils";

interface HeroSectionProps {
  songs: Song[];
  index: number;
  setIndex: (idx: number) => void;
  isLoading: boolean;
}

export function HeroSection({
  songs,
  index,
  setIndex,
  isLoading,
}: HeroSectionProps) {
  const currentSong = songs[index] || songs[0];

  if (isLoading) {
    return (
      <div className="w-full h-[450px] rounded-[3rem] bg-zinc-900/50 animate-pulse border border-white/5" />
    );
  }

  if (!currentSong) return null;

  return (
    <section className="relative w-full h-[450px] rounded-[3rem] overflow-hidden group shadow-2xl border border-white/5">
      {/* Background with Blur & Gradient */}
      <div className="absolute inset-0 z-0 bg-black">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentSong.id}
            src={getImageUrl(currentSong.imageKey, {
              width: 1200,
              height: 600,
              blur: 5,
              quality: 90,
            })}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-16">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={`meta-${currentSong.id}`}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full backdrop-blur-xl">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">
                  Featured Release
                </span>
              </div>
            </div>

            <h1 className="text-6xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl max-w-3xl line-clamp-2">
              {currentSong.title}
            </h1>
            <p className="text-xl text-zinc-400 font-bold italic mt-4 flex items-center gap-2">
              by <span className="text-white underline decoration-primary decoration-2 underline-offset-4">{currentSong.artistName}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-6 pt-4"
          >
            <button
              onClick={() => playerActions.play(mapToPlayerSong(currentSong))}
              className="px-10 py-5 bg-primary text-black rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <Play fill="black" size={24} />
              Play Now
            </button>

            {/* Carousel Dots */}
            {songs.length > 1 && (
              <div className="flex items-center gap-2.5 ml-auto">
                {songs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`h-2.5 transition-all duration-500 rounded-full ${
                      i === index
                        ? "w-10 bg-primary shadow-[0_0_15px_rgba(74,222,128,0.5)]"
                        : "w-2.5 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
