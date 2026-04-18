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
  Volume1,
  Music,
  ChevronDown,
  Activity,
  Repeat1,
  Layers,
  Clock,
  Mic2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "../lib/image-utils";

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
  const progressRef = useRef<HTMLDivElement>(null);
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

        if (currentSong?.streamUrl) {
          setIsLoading(true);
          await player.load(currentSong.streamUrl);
          if (!isMounted) return;
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

    if (currentSong?.id !== last.id) {
      if (last.id && last.duration > 0) {
        const part = Math.min(
          100,
          Math.floor((last.time / last.duration) * 100),
        );
        if (part > 1 || last.time > 5) {
          playerActions.recordListen(last.id, part);
        }
      }

      lastStateRef.current = {
        id: currentSong?.id || "",
        time: 0,
        duration: currentSong?.duration || 0,
      };
    }
  }, [currentSong?.id]);

  // Handle Recording on End
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      const last = lastStateRef.current;
      if (last.id) {
        playerActions.recordListen(last.id, 100);
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
        );
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

    // Update ref for recording later
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

  // Seek on progress click
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
  };

  // Get the optimized poster URL via ImageKit
  const optimizedPosterUrl = currentSong?.imageKey
    ? getImageUrl(currentSong.imageKey, {
        width: 720,
        height: 720,
        focus: "auto",
        aspectRatio: "1-1",
        quality: 90,
      })
    : currentSong?.posterUrl || "";

  // ─── Empty State ───
  if (!currentSong) {
    return (
      <div className="w-[380px] glass-heavy flex flex-col items-center justify-center p-10 text-center flex-none">
        <div className="w-20 h-20 rounded-3xl bg-zinc-900/80 border border-white/5 flex items-center justify-center mb-6">
          <Music className="h-8 w-8 text-zinc-700" />
        </div>
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] italic leading-relaxed">
          Select a frequency<br />to synchronize
        </p>
      </div>
    );
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (localTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="w-[380px] bg-zinc-950/95 backdrop-blur-2xl border-l border-white/[0.04] flex flex-col h-screen overflow-hidden flex-none relative z-50">
      {/* ─── Ambient Glow Background ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -inset-20 blur-[100px] opacity-20 ambient-drift"
          style={{
            backgroundImage: `url(${optimizedPosterUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950" />
      </div>

      <audio ref={audioRef} className="hidden" crossOrigin="anonymous" />

      {/* ─── Album Art ─── */}
      <div className="flex-none px-8 pt-10 pb-4 relative z-10">
        <motion.div
          key={currentSong.id}
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="aspect-square w-full rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/[0.06] ring-1 ring-white/[0.03]"
        >
          <img
            src={optimizedPosterUrl}
            className="w-full h-full object-cover"
            alt={currentSong.title}
          />
        </motion.div>
      </div>

      {/* ─── Track Info ─── */}
      <div className="flex-none px-8 py-3 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-white italic uppercase tracking-tight truncate leading-tight">
              {currentSong.title}
            </h2>
            <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-[0.15em] italic mt-1 truncate">
              {currentSong.artistName}
            </p>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={() => playerActions.toggleRepeat()}
              className={`p-2 rounded-xl transition-all ${
                repeatMode !== "none"
                  ? "text-indigo-400 bg-indigo-500/10"
                  : "text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              <Repeat1 size={16} />
            </button>
            <button
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              className="p-2 text-zinc-600 hover:text-zinc-300 hover:bg-white/5 rounded-xl transition-all"
            >
              <Layers size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Word-Level Lyrics ─── */}
      <div className="flex-1 overflow-hidden relative z-10 px-8 flex flex-col justify-center lyrics-mask">
        <div className="min-h-[140px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {currentCaption ? (
              <motion.div
                key={currentCaption.start_time_seconds}
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-center px-2"
              >
                {currentCaption.words.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-x-[6px] gap-y-1">
                    {currentCaption.words.map((word, idx) => {
                      const isActive =
                        localTime >= word.start && localTime <= word.end;
                      const isPast = localTime > word.end;
                      return (
                        <motion.span
                          key={idx}
                          animate={{
                            color: isActive
                              ? "#ffffff"
                              : isPast
                                ? "rgba(255,255,255,0.45)"
                                : "rgba(255,255,255,0.15)",
                            scale: isActive ? 1.08 : 1,
                          }}
                          transition={{ duration: 0.15 }}
                          className={`text-xl font-black italic tracking-tight leading-relaxed ${
                            isActive ? "text-glow" : ""
                          }`}
                        >
                          {word.text}
                        </motion.span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xl font-black italic tracking-tight text-white/80 leading-relaxed text-glow">
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
                className="flex flex-col items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Mic2 className="text-zinc-700" size={18} />
                </div>
                <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.2em] italic">
                  Awaiting Lyrics
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Controls Panel ─── */}
      <div className="flex-none px-8 pb-8 pt-4 space-y-5 relative z-10">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div
            ref={progressRef}
            onClick={handleSeek}
            className="progress-track relative h-[3px] bg-white/[0.06] rounded-full overflow-visible group"
          >
            {/* Buffered */}
            <div
              className="absolute top-0 left-0 h-full bg-white/[0.08] rounded-full"
              style={{ width: `${bufferedPct}%` }}
            />
            {/* Progress */}
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-[width] duration-75"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #6366f1, #818cf8)",
              }}
            />
            {/* Thumb */}
            <div
              className="progress-thumb"
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-zinc-600 tabular-nums">
            <span>{formatTime(localTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Core Buttons */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => playerActions.previous()}
            className="text-zinc-500 hover:text-white transition-colors active:scale-90"
          >
            <SkipBack size={22} fill="currentColor" />
          </button>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => playerActions.setIsPlaying(!isPlaying)}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-black shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_4px_30px_rgba(255,255,255,0.25)] transition-shadow"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-[3px] border-black/10 border-t-black rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={22} fill="black" />
            ) : (
              <Play size={22} fill="black" className="ml-0.5" />
            )}
          </motion.button>

          <button
            onClick={() => playerActions.next()}
            className="text-zinc-500 hover:text-white transition-colors active:scale-90"
          >
            <SkipForward size={22} fill="currentColor" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 px-1">
          <button
            onClick={() => playerActions.setIsMuted(!isMuted)}
            className="text-zinc-600 hover:text-zinc-300 transition-colors flex-none"
          >
            <VolumeIcon size={15} />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => playerActions.setVolume(parseFloat(e.target.value))}
            className="volume-slider flex-1"
          />
        </div>

        {/* Quality Selector */}
        <AnimatePresence>
          {showQualityMenu && qualityTracks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 space-y-1 overflow-hidden"
            >
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2 pb-1 mb-1 border-b border-white/5">
                Stream Quality
              </p>
              <button
                onClick={() => {
                  playerActions.setSelectedQuality("auto");
                  setShowQualityMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedQuality === "auto"
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                }`}
              >
                Auto
              </button>
              {qualityTracks.map((t: any) => (
                <button
                  key={t.bandwidth}
                  onClick={() => {
                    playerActions.setSelectedQuality(t.bandwidth);
                    setShowQualityMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedQuality === t.bandwidth
                      ? "bg-indigo-500/15 text-indigo-400"
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {Math.round(t.bandwidth / 1000)} kbps
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
