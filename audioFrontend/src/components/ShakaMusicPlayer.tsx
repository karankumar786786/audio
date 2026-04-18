"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
// @ts-ignore
import shaka from "shaka-player";
import { useStore } from "@tanstack/react-store";
import { playerStore, playerActions } from "../store/player.store";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
  ChevronDown,
  Activity,
  Repeat1,
  Layers,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WordEntry {
  text: string;
  start: number;
  end: number;
}

interface TranscriptionEntry {
  transcript: string;
  start_time_seconds: number;
  end_time_seconds: number;
  words: WordEntry[];
}

export function ShakaMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<any>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastStateRef = useRef<{ id: string; time: number; duration: number }>({
    id: "",
    time: 0,
    duration: 0,
  });

  const state = useStore(playerStore, (s) => s);
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    duration,
    repeatMode,
    qualityTracks,
    selectedQuality,
  } = state;

  const [localTime, setLocalTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>(
    [],
  );
  const [currentCaption, setCurrentCaption] =
    useState<TranscriptionEntry | null>(null);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync Shaka Quality Tracks to Store
  const syncTracks = useCallback(() => {
    if (!playerRef.current) return;
    const tracks = playerRef.current.getVariantTracks();
    const unique = tracks
      .filter(
        (t: any, idx: number, self: any[]) =>
          self.findIndex((x) => x.bandwidth === t.bandwidth) === idx,
      )
      .sort((a: any, b: any) => a.bandwidth - b.bandwidth);
    playerActions.setQualityTracks(unique);
  }, []);

  // Initialize & Load Shaka
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    shaka.polyfill.installAll();
    if (!shaka.Player.isBrowserSupported()) {
      console.warn("[Shaka] Not supported, falling back to native src");
      if (currentSong) {
        audio.src = currentSong.streamUrl;
        audio.load();
      }
      return;
    }

    const player = new shaka.Player();
    playerRef.current = player;

    player.configure({
      streaming: {
        retryParameters: {
          maxAttempts: 4,
          baseDelay: 1000,
          backoffFactor: 2,
          fuzzFactor: 0.5,
          timeout: 30000,
        },
      },
      manifest: {
        retryParameters: {
          maxAttempts: 4,
          baseDelay: 1000,
          backoffFactor: 2,
          fuzzFactor: 0.5,
          timeout: 30000,
        },
      },
    });

    player.addEventListener("error", (e: any) =>
      console.error("[Shaka] Error event:", e.detail),
    );
    player.addEventListener("trackschanged", syncTracks);

    let isMounted = true;

    const init = async () => {
      try {
        await player.attach(audio);
        if (!isMounted) return;
        console.log("[Shaka] Player attached.");

        if (currentSong?.streamUrl) {
          setIsLoading(true);
          await player.load(currentSong.streamUrl);
          if (!isMounted) return;
          console.log("[Shaka] Content loaded:", currentSong.title);
          setIsLoading(false);
          if (isPlaying) audio.play().catch(console.error);
        }
      } catch (e) {
        console.error("[Shaka] Initialization/Load failed:", e);
        setIsLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      player.destroy();
    };
  }, [currentSong?.id, syncTracks]);

  // Handle song recording on change
  useEffect(() => {
    const last = lastStateRef.current;

    // 1. If song changed, record the previous song's final state
    if (currentSong?.id !== last.id) {
      if (last.id && last.duration > 0) {
        const part = Math.min(
          100,
          Math.floor((last.time / last.duration) * 100),
        ); // Ensure integer
        if (part > 1 || last.time > 5) {
          playerActions.recordListen(last.id, part);
        }
      }

      // 2. Initialize tracking for the new song
      lastStateRef.current = {
        id: currentSong?.id || "",
        time: 0,
        duration: currentSong?.duration || 0,
      };
    }
  }, [currentSong?.id]);

  // Handle Recording on End (Ended Event)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      const last = lastStateRef.current;
      if (last.id) {
        playerActions.recordListen(last.id, 100);
        // Clear ID to prevent double-recording on change/unmount
        lastStateRef.current = { id: "", time: 0, duration: 0 };
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentSong?.id]);

  // Handle Recording on Unmount
  useEffect(() => {
    return () => {
      const last = lastStateRef.current;
      if (last.id && last.duration > 0) {
        const part = Math.min(
          100,
          Math.floor((last.time / last.duration) * 100),
        ); // Ensure integer
        if (part > 1 || last.time > 5) {
          playerActions.recordListen(last.id, part);
        }
      }
    };
  }, []);

  // Load Lyrics (VTT/JSON)
  useEffect(() => {
    if (!currentSong?.captionUrl) {
      setTranscriptions([]);
      return;
    }

    fetch(currentSong.captionUrl)
      .then(async (r) => {
        const text = await r.text();
        const lines = text.split("\n");
        const chunks: TranscriptionEntry[] = [];
        let currentChunk: TranscriptionEntry | null = null;

        const timeToSec = (t: string) => {
          const p = t.split(":");
          return p.length === 3
            ? parseInt(p[0]) * 3600 + parseInt(p[1]) * 60 + parseFloat(p[2])
            : parseInt(p[0]) * 60 + parseFloat(p[1]);
        };

        for (const line of lines) {
          const l = line.trim();
          if (!l || l.startsWith("WEBVTT")) continue;

          if (l.includes("-->")) {
            const [s, e] = l.split("-->").map((x) => x.trim());
            currentChunk = {
              start_time_seconds: timeToSec(s),
              end_time_seconds: timeToSec(e),
              transcript: "",
              words: [],
            };
            chunks.push(currentChunk);
          } else if (currentChunk) {
            const wordMatches = Array.from(
              l.matchAll(/<([\d:.]+)>\s*([^<]+)/g),
            );
            if (wordMatches.length > 0) {
              wordMatches.forEach((m, idx) => {
                const wStart = timeToSec(m[1]);
                const wText = m[2].trim();
                let wEnd = currentChunk!.end_time_seconds;
                if (idx < wordMatches.length - 1)
                  wEnd = timeToSec(wordMatches[idx + 1][1]);
                currentChunk!.words.push({
                  text: wText,
                  start: wStart,
                  end: wEnd,
                });
              });
              currentChunk.transcript += l.replace(/<[^>]+>/g, "").trim();
            } else {
              currentChunk.transcript +=
                (currentChunk.transcript ? " " : "") + l;
            }
          }
        }
        setTranscriptions(chunks);
      })
      .catch(() => setTranscriptions([]));
  }, [currentSong?.id]);

  // High Precision Sync (RAF)
  const syncTime = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      animFrameRef.current = requestAnimationFrame(syncTime);
      return;
    }

    const t = audio.currentTime;
    setLocalTime(t);
    playerActions.setCurrentTime(t);

    if (audio.buffered.length)
      setBuffered(audio.buffered.end(audio.buffered.length - 1));
    if (audio.duration && audio.duration !== duration) {
      playerActions.setDuration(audio.duration);
    }

    // Update ref for recording later - ONLY if it's the same song
    if (currentSong && lastStateRef.current.id === currentSong.id) {
      lastStateRef.current.time = t;
      lastStateRef.current.duration =
        audio.duration || duration || lastStateRef.current.duration;
    }

    // Find active caption
    let active: TranscriptionEntry | null = null;
    for (let i = transcriptions.length - 1; i >= 0; i--) {
      const e = transcriptions[i];
      if (t >= e.start_time_seconds && t <= e.end_time_seconds) {
        active = e;
        break;
      }
    }

    if (active !== currentCaption) {
      setCurrentCaption(active);
      // Auto-scroll logic if needed
    }

    animFrameRef.current = requestAnimationFrame(syncTime);
  }, [transcriptions, currentCaption, duration]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(syncTime);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [syncTime]);

  // Playback Control Sync
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => playerActions.setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong?.id]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  if (!currentSong) {
    return (
      <div className="w-[360px] bg-zinc-950 border-l border-white/5 flex flex-col items-center justify-center p-10 text-center flex-none">
        <Music className="h-12 w-12 text-zinc-800 mb-6 animate-pulse" />
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest italic opacity-50">
          Select a frequency to synchronize
        </p>
      </div>
    );
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const currentIdx = transcriptions.indexOf(currentCaption!);

  return (
    <div className="w-[360px] bg-zinc-950 border-l border-white/5 flex flex-col h-screen overflow-hidden flex-none relative z-50">
      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div
          className="absolute inset-x-0 -top-40 h-[600px] w-full blur-[120px] transition-all duration-1000"
          style={{
            backgroundImage: `url(${currentSong.posterUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <audio ref={audioRef} className="hidden" crossOrigin="anonymous" />

      {/* Album Art Section - 30% */}
      <div className="flex-none p-8 pt-12 text-center relative z-10">
        <motion.div
          key={currentSong.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="aspect-square w-full rounded-[40px] overflow-hidden shadow-2xl shadow-black/50 border border-white/10 ring-1 ring-white/5"
        >
          <img
            src={currentSong.posterUrl}
            className="w-full h-full object-cover"
            alt={currentSong.title}
          />
        </motion.div>
      </div>

      {/* Word-Level Lyrics - 40% */}
      <div className="flex-1 overflow-hidden relative z-10 px-8 flex flex-col justify-center">
        <div className="min-h-[120px] text-center flex flex-col items-center justify-center gap-4">
          {currentCaption ? (
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
              {currentCaption.words.length > 0 ? (
                currentCaption.words.map((word, idx) => {
                  const isActive =
                    localTime >= word.start && localTime <= word.end;
                  return (
                    <motion.span
                      key={idx}
                      animate={{
                        color: isActive ? "#ffffff" : "rgba(255,255,255,0.2)",
                        scale: isActive ? 1.05 : 1,
                      }}
                      className="text-2xl font-black italic tracking-tighter"
                    >
                      {word.text}
                    </motion.span>
                  );
                })
              ) : (
                <span className="text-2xl font-black italic tracking-tighter text-white/90">
                  {currentCaption.transcript}
                </span>
              )}
            </div>
          ) : (
            <Activity className="text-zinc-800 animate-pulse h-8 w-8" />
          )}
        </div>
      </div>

      {/* Controls - 30% */}
      <div className="flex-none p-8 pb-10 space-y-8 relative z-10 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
        {/* Track Info */}
        <div className="space-y-1">
          <h2 className="text-xl font-black text-zinc-100 italic uppercase tracking-tighter truncate">
            {currentSong.title}
          </h2>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] italic opacity-80">
            {currentSong.artistName}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-black text-zinc-500 italic">
            <span>{formatTime(localTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="relative h-1 bg-zinc-900 rounded-full overflow-hidden group cursor-pointer">
            <div
              className="absolute top-0 left-0 h-full bg-zinc-800"
              style={{ width: `${(buffered / duration) * 100}%` }}
            />
            <div
              className="absolute top-0 left-0 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              style={{ width: `${(localTime / duration) * 100}%` }}
            />
          </div>
        </div>

        {/* Core Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => playerActions.toggleRepeat()}
            className={`p-2 transition-colors ${repeatMode !== "none" ? "text-indigo-400" : "text-zinc-600 hover:text-white"}`}
          >
            <Repeat1 size={20} />
          </button>

          <div className="flex items-center gap-6">
            <button
              onClick={() => playerActions.previous()}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <SkipBack size={24} fill="currentColor" />
            </button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => playerActions.setIsPlaying(!isPlaying)}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black shadow-2xl"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-black/10 border-t-black rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={24} fill="black" />
              ) : (
                <Play size={24} fill="black" className="ml-1" />
              )}
            </motion.button>

            <button
              onClick={() => playerActions.next()}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>

          <button
            onClick={() => setShowQualityMenu(!showQualityMenu)}
            className="p-2 text-zinc-600 hover:text-white"
          >
            <Layers size={20} />
          </button>
        </div>

        {/* Quality Selector (Optional Popup logic would go here) */}
      </div>
    </div>
  );
}
