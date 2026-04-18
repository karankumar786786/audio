"use client";

import { useStore } from "@tanstack/react-store";
import { playerStore, playerActions } from "../store/player.store";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface LyricLine {
  time: number;
  text: string;
}

// Mock Lyrics for any song since we don't have a lyrics API yet
const MOCK_LYRICS: LyricLine[] = [
  { time: 0, text: "♪ (Intro)" },
  { time: 5, text: "The rhythm starts to fade away" },
  { time: 10, text: "Into the echoes of the night" },
  { time: 15, text: "I see the colors of the day" },
  { time: 20, text: "Drowning in the neon light" },
  { time: 25, text: "Can you feel the pulse inside?" },
  { time: 30, text: "The static in the air tonight" },
  { time: 35, text: "No more secrets left to hide" },
  { time: 40, text: "We're dancing in the silver light" },
  { time: 45, text: "♪ (Instrumental Break)" },
  { time: 60, text: "Everything changes in a heartbeat" },
  { time: 65, text: "Just like the shadows in the street" },
  { time: 70, text: "Lost in the sound of the deep heat" },
  { time: 75, text: "Moving to the rhythm of the beat" },
];

export function LyricsOverlay() {
  const { isLyricsOpen, currentSong, currentTime } = useStore(
    playerStore,
    (s) => s,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const index = MOCK_LYRICS.findIndex((line, i) => {
      const nextLine = MOCK_LYRICS[i + 1];
      return (
        currentTime >= line.time && (!nextLine || currentTime < nextLine.time)
      );
    });

    if (index !== activeIndex) {
      setActiveIndex(index);
      // Auto-scroll to active line
      const activeElement = document.getElementById(`lyric-${index}`);
      if (activeElement && scrollRef.current) {
        scrollRef.current.scrollTo({
          top: activeElement.offsetTop - scrollRef.current.clientHeight / 2,
          behavior: "smooth",
        });
      }
    }
  }, [currentTime, activeIndex]);

  if (!currentSong) return null;

  return (
    <AnimatePresence>
      {isLyricsOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          className="fixed inset-0 z-[150] bg-black flex overflow-hidden lg:flex-row flex-col"
        >
          {/* Immersive Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-900/30 blur-[150px] animate-pulse" />
            <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-purple-900/20 blur-[100px]" />
          </div>

          {/* Left Side: Art & Title */}
          <div className="lg:w-1/2 w-full flex flex-col items-center justify-center p-12 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-[400px] aspect-square rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden mb-8"
            >
              <img
                src={`https://ik.imagekit.io/zaa6pbi9f${currentSong.imageKey}`}
                className="w-full h-full object-cover"
                alt="Artwork"
              />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black mb-2"
            >
              {currentSong.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-zinc-500 font-medium"
            >
              {currentSong.artistName}
            </motion.p>
          </div>

          {/* Right Side: Scrollable Lyrics */}
          <div className="lg:w-1/2 w-full flex flex-col items-center relative py-20 pr-10">
            <div className="absolute top-10 right-10 flex gap-4">
              <button
                onClick={() => playerActions.toggleLyrics()}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all backdrop-blur-md"
              >
                <X size={24} />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="w-full flex flex-col gap-8 overflow-y-auto px-12 py-32 scrollbar-none mask-fade-edges"
            >
              {MOCK_LYRICS.map((line, i) => (
                <motion.div
                  key={i}
                  id={`lyric-${i}`}
                  animate={{
                    opacity: activeIndex === i ? 1 : 0.3,
                    scale: activeIndex === i ? 1.05 : 1,
                    x: activeIndex === i ? 10 : 0,
                  }}
                  className={`text-3xl md:text-5xl font-black leading-tight transition-all cursor-pointer hover:opacity-100 ${activeIndex === i ? "text-white" : "text-zinc-600"}`}
                >
                  {line.text}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
