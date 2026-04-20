"use client";

import { useStore } from "@tanstack/react-store";
import { playerStore, playerActions } from "../store/player.store";
import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize2,
  Music,
  ListMusic,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MusicPlayer() {
  const state = useStore(playerStore, (s) => s);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;

    if (state.isPlaying) {
      audioRef.current.play().catch(() => playerActions.setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [state.isPlaying, state.currentSong?.id]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = state.volume;
  }, [state.volume]);

  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    playerActions.setCurrentTime(audioRef.current.currentTime);
    playerActions.setDuration(audioRef.current.duration || 0);
  };

  const togglePlay = () => {
    if (state.isPlaying) playerActions.setIsPlaying(false);
    else playerActions.setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    playerActions.setCurrentTime(time);
  };

  if (!state.currentSong) return null;

  return (
    <motion.footer
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 h-24 bg-zinc-950/80 backdrop-blur-2xl border-t border-white/5 px-6 flex items-center justify-between z-[100] shadow-2xl"
    >
      <audio
        ref={audioRef}
        src={`https://ik.imagekit.io/zaa6pbi9f${state.currentSong.songKey}`}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => playerActions.setIsPlaying(false)}
      />

      {/* Info */}
      <div className="flex items-center gap-4 w-1/3">
        <motion.div
          layoutId="player-art"
          className="w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10"
        >
          <img
            src={`https://ik.imagekit.io/zaa6pbi9f${state.currentSong.imageKey}`}
            className="w-full h-full object-cover"
            alt="Art"
          />
        </motion.div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate hover:underline cursor-pointer">
            {state.currentSong.title}
          </p>
          <p className="text-xs text-zinc-400 truncate hover:text-white transition-colors">
            {state.currentSong.artistName}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2 w-1/3">
        <div className="flex items-center gap-6">
          <button className="text-zinc-400 hover:text-white transition-colors">
            <SkipBack fill="currentColor" size={20} />
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
          >
            {state.isPlaying ? (
              <Pause fill="black" size={20} />
            ) : (
              <Play className="ml-1" fill="black" size={20} />
            )}
          </button>
          <button className="text-zinc-400 hover:text-white transition-colors">
            <SkipForward fill="currentColor" size={20} />
          </button>
        </div>

        <div className="w-full max-w-lg flex items-center gap-3 group">
          <span className="text-[10px] font-medium text-zinc-500 min-w-[30px] text-right">
            {formatTime(state.currentTime)}
          </span>
          <div className="relative flex-1 h-6 flex items-center">
            <input
              type="range"
              min={0}
              max={state.duration || 100}
              value={state.currentTime}
              onChange={handleSeek}
              className="absolute w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-primary overflow-hidden"
              style={{
                background: `linear-gradient(to right, var(--primary) ${state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0}%, #27272a ${state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0}%)`,
              }}
            />
          </div>
          <span className="text-[10px] font-medium text-zinc-500 min-w-[30px]">
            {formatTime(state.duration)}
          </span>
        </div>
      </div>

      {/* Extra actions */}
      <div className="flex items-center justify-end gap-4 w-1/3">
        <button
          onClick={() => playerActions.toggleLyrics()}
          className={`p-2 rounded-lg transition-all ${state.isLyricsOpen ? "text-primary bg-primary/10" : "text-zinc-400 hover:text-white"}`}
          title="Lyrics"
        >
          <Music size={18} />
        </button>
        <button className="text-zinc-400 hover:text-white transition-colors">
          <ListMusic size={18} />
        </button>

        <div className="flex items-center gap-2 group ml-2">
          <Volume2
            className="text-zinc-400 group-hover:text-white transition-colors"
            size={18}
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.volume}
            onChange={(e) =>
              playerActions.setVolume(parseFloat(e.target.value))
            }
            className="w-20 h-1 bg-zinc-800 rounded-full accent-white cursor-pointer"
          />
        </div>
      </div>
    </motion.footer>
  );
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
