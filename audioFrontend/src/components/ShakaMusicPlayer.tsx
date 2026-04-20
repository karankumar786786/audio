"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
// @ts-ignore
import shaka from "shaka-player";
console.log("[Player] 🧬 ShakaMusicPlayer module execution started");
import { useStore } from "@tanstack/react-store";
import { playerStore, playerActions } from "../store/player.store";
import {

  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  Music,
  Repeat1,
  Mic2,
  Heart,
  Plus,
  ChevronDown,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "../lib/image-utils";
import { PlaylistPickerModal } from "./PlaylistPickerModal";
import { toast } from "sonner";

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
  const isInternalChange = useRef(false);

  const state = useStore(playerStore, (s) => s);
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    repeatMode,
    isShuffle,
    qualityTracks,
    selectedQuality,
    isLyricsOpen,
    favourites,
    systemUser,
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
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Initialize Player State (Persistence + Recommendations)
  useEffect(() => {
    playerActions.hydrate();
    playerActions.initQueue();
  }, []);

  // Diagnostic: Log state changes (only on significant updates)
  useEffect(() => {
    console.log("[Player] 📊 State/Song Change:", {
      hasSong: !!currentSong,
      songId: currentSong?.id,
      isPlaying,
      isPlayerReady,
      isLoading
    });
  }, [isPlaying, isLoading, isPlayerReady, currentSong?.id]);

  const isFavourite = currentSong ? favourites.has(currentSong.id) : false;

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

  // Synchronize store state with actual audio state to fix UI glitches
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => {
      console.log("[Audio] 🔈 Native PLAY detected");
      if (isInternalChange.current || audio.readyState === 0) return;
      playerActions.setIsPlaying(true);
    };
    const onPause = () => {
      console.log("[Audio] 🔈 Native PAUSE detected");
      if (isInternalChange.current || audio.readyState === 0) return;
      playerActions.setIsPlaying(false);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("playing", onPlay);
    audio.addEventListener("pause", onPause);

    // Intense Debugging: native status events
    const onWaiting = () => console.log("[Audio] ⏳ WAITING (buffering)...");
    const onStalled = () => console.log("[Audio] ⚠️ STALLED");
    const onCanPlay = () => console.log("[Audio] ✅ CANPLAY (ready)");
    const onError = () => console.error("[Audio] ❌ ERROR:", audio.error);

    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("stalled", onStalled);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("playing", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("stalled", onStalled);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
    };
  }, []);

  // ─── UNIFIED PLAYER LIFECYCLE ───
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let isMounted = true;

    const runLifecycle = async () => {
      try {
        console.log("[Player] 🧬 Unified Lifecycle Triggered", {
          songId: currentSong?.id,
          hasPlayer: !!playerRef.current
        });

        // 1. Initialize Player Instance if missing
        if (!playerRef.current) {
          console.log("[Player] 🛠️ Creating and configuring Shaka engine...");
          shaka.polyfill.installAll();
          const player = new shaka.Player();
          playerRef.current = player;

          player.configure({
            streaming: {
              retryParameters: { maxAttempts: 4, baseDelay: 1000, backoffFactor: 2, fuzzFactor: 0.5, timeout: 30000 },
            },
            manifest: {
              retryParameters: { maxAttempts: 4, baseDelay: 1000, backoffFactor: 2, fuzzFactor: 0.5, timeout: 30000 },
            },
          });

          player.addEventListener("error", (e: any) => {
            console.error("[Shaka] ❌ Engine error:", e.detail);
            const code = e.detail.code;
            let message = "Playback error";
            if (code === 1001) message = "Manifest fetch failed (Network/CORS)";
            if (code === 403) message = "Access denied (Invalid token)";
            toast.error(message, { description: `Error code: ${code}. Check backend logs.` });
          });

          player.addEventListener("trackschanged", syncTracks);

          console.log("[Player] 🔌 Attaching audio element...");
          await player.attach(audio);
          console.log("[Player] ✅ Engine attached and ready");
        }

        const player = playerRef.current;

        // 2. Load and Play Track if URL is present
        if (currentSong?.streamUrl) {
          console.log(`[Player] 💿 Loading Track: ${currentSong.title}`, { url: currentSong.streamUrl });
          isInternalChange.current = true;
          setIsLoading(true);

          await player.load(currentSong.streamUrl);
          if (!isMounted) return;

          console.log("[Player] ✅ Track Loaded successfully");
          setIsLoading(false);
          syncTracks();

          if (playerStore.state.isPlaying) {
            console.log("[Player] ▶️ Triggering playback...");
            try {
              await audio.play();
              console.log("[Player] 🎶 Playback started successfully");
            } catch (err) {
              console.warn("[Player] ⚠️ Playback start failed:", err);
            }
          }

          setTimeout(() => {
            if (isMounted) {
              console.log("[Player] 🛡️ Guard cleared");
              isInternalChange.current = false;
            }
          }, 500);
        }
      } catch (e) {
        console.error("[Player] ❌ Unified Lifecycle Error:", e);
        if (isMounted) {
          setIsLoading(false);
          isInternalChange.current = false;
        }
      }
    };

    runLifecycle();

    return () => {
      isMounted = false;
      // We keep the player instance alive between track changes for speed.
      // Destruction only happens on full component unmount (rare in layout).
    };
  }, [currentSong?.id, syncTracks]);

  // Handle song recording on change
  useEffect(() => {
    const last = lastStateRef.current;
    if (currentSong?.id !== last.id) {
      if (last.id && last.duration > 0) {
        const part = Math.min(100, Math.floor((last.time / last.duration) * 100));
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
      console.log("[Player] 🔚 Song ended naturally, transitioning...");
      isInternalChange.current = true;
      const last = lastStateRef.current;
      if (last.id) {
        playerActions.recordListen(last.id, 100);
        lastStateRef.current = { id: "", time: 0, duration: 0 };
      }
      playerActions.next();
    };
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentSong?.id]);

  // Handle Recording on Unmount
  useEffect(() => {
    return () => {
      const last = lastStateRef.current;
      if (last.id && last.duration > 0) {
        const part = Math.min(100, Math.floor((last.time / last.duration) * 100));
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
            const wordMatches = Array.from(l.matchAll(/<([\d:.]+)>\s*([^<]+)/g));
            if (wordMatches.length > 0) {
              wordMatches.forEach((m, idx) => {
                const wStart = timeToSec(m[1]);
                const wText = m[2].trim();
                let wEnd = currentChunk!.end_time_seconds;
                if (idx < wordMatches.length - 1) wEnd = timeToSec(wordMatches[idx + 1][1]);
                currentChunk!.words.push({ text: wText, start: wStart, end: wEnd });
              });
              currentChunk.transcript += l.replace(/<[^>]+>/g, "").trim();
            } else {
              currentChunk.transcript += (currentChunk.transcript ? " " : "") + l;
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
    if (audio.buffered.length) setBuffered(audio.buffered.end(audio.buffered.length - 1));
    if (audio.duration && audio.duration !== duration) {
      playerActions.setDuration(audio.duration);
    }
    if (currentSong && lastStateRef.current.id === currentSong.id) {
      lastStateRef.current.time = t;
      lastStateRef.current.duration = audio.duration || duration || lastStateRef.current.duration;
    }
    let active: TranscriptionEntry | null = null;
    for (let i = transcriptions.length - 1; i >= 0; i--) {
      const e = transcriptions[i];
      if (t >= e.start_time_seconds && t <= e.end_time_seconds) {
        active = e;
        break;
      }
    }
    if (active !== currentCaption) setCurrentCaption(active);
    animFrameRef.current = requestAnimationFrame(syncTime);
  }, [transcriptions, currentCaption, duration]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(syncTime);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [syncTime]);

  // Playback Control Sync
  useEffect(() => {
    if (!audioRef.current || isLoading) return;
    const audio = audioRef.current;

    if (isPlaying) {
      if (audio.paused) {
        audio.play().catch((err) => {
          if (err.name !== "AbortError") {
            console.warn("[Player] Play failed:", err);
          }
        });
      }
    } else {
      // Only pause if we aren't in the middle of a requested song start
      if (!audio.paused && !isInternalChange.current) {
        audio.pause();
      }
    }
  }, [isPlaying, isLoading, currentSong?.id || "none"]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Handle Quality switching
  useEffect(() => {
    if (!playerRef.current) return;
    const player = playerRef.current;

    if (selectedQuality === "auto") {
      player.configure({ abr: { enabled: true } });
    } else {
      player.configure({ abr: { enabled: false } });
      const tracks = player.getVariantTracks();
      const track = tracks.find((t: any) => t.bandwidth === selectedQuality);
      if (track) {
        player.selectVariantTrack(track, true); // true = clear existing buffer to switch immediately
      }
    }
  }, [selectedQuality, currentSong?.id]);

  // Seek Change Handler (Native Slider)
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !duration) return;
    const val = parseFloat(e.target.value);
    audioRef.current.currentTime = val;
    setLocalTime(val);
  };

  // Volume Change Handler (Native Slider)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    playerActions.setVolume(val);
  };

  // Toggle favourite
  // Sync Favourites on mount
  useEffect(() => {
    if (systemUser?.id) {
      playerActions.fetchFavourites();
    }
  }, [systemUser?.id]);

  const [isTogglingFav, setIsTogglingFav] = useState(false);

  const handleToggleFavourite = async () => {
    if (!systemUser?.id || !currentSong) {
      toast.error("Sign in required");
      return;
    }
    if (isTogglingFav) return;

    const wasFav = isFavourite;
    setIsTogglingFav(true);

    toast.promise(playerActions.toggleFavourite(currentSong.id), {
      loading: wasFav ? "Removing from Favourites..." : "Adding to Favourites...",
      success: () => {
        setIsTogglingFav(false);
        return wasFav ? "Removed from Favourites" : "Added to Favourites";
      },
      error: () => {
        setIsTogglingFav(false);
        return "Failed to update Favourites";
      },
      description: () => {
        return wasFav
          ? `"${currentSong.title}" removed.`
          : `"${currentSong.title}" added to favourites.`;
      }
    });
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
          Select a track<br />to start playing
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
  const volumePct = isMuted ? 0 : volume * 100;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <>
      <div className="w-[340px] glass-effect-strong border-l border-white/4 flex flex-col h-screen overflow-hidden flex-none relative z-50">
        {/* ─── Ambient Glow ─── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -inset-20 blur-[100px] opacity-20 ambient-drift"
            style={{
              backgroundImage: `url(${optimizedPosterUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950" />
        </div>

        <audio ref={audioRef} className="hidden" crossOrigin="anonymous" />

        {/* ─── Album Art (compact) ─── */}
        <div className="flex-none px-6 pt-6 pb-2 relative z-10">
          <motion.div
            key={currentSong.id}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="aspect-square w-full rounded-3xl overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.5)] border border-white/6"
          >
            <img
              src={optimizedPosterUrl}
              className="w-full h-full object-cover"
              alt={currentSong.title}
            />
          </motion.div>
        </div>

        {/* ─── Track Info + Actions ─── */}
        <div className="flex-none px-6 py-2 relative z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black text-white italic uppercase tracking-tight truncate leading-tight text-glow-green">
                {currentSong.title}
              </h2>
              <p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.15em] italic mt-0.5 truncate">
                {currentSong.artistName}
              </p>
            </div>
            <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
              <button
                onClick={handleToggleFavourite}
                className={`p-2 rounded-xl transition-all ${isFavourite
                  ? "text-primary shadow-2xl shadow-primary/20"
                  : "text-zinc-600 hover:text-primary hover:bg-white/5"
                  }`}
                title={isFavourite ? "Remove from favourites" : "Add to favourites"}
              >
                <Heart size={15} fill={isFavourite ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => {
                  if (!systemUser?.id) {
                    toast.error("Sign in required");
                    return;
                  }
                  setIsPlaylistModalOpen(true);
                }}
                className="p-2 text-zinc-600 hover:text-primary hover:bg-white/5 rounded-xl transition-all"
                title="Add to playlist"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Word-Level Lyrics (more space) ─── */}
        <div className="flex-1 overflow-hidden relative z-10 px-6 flex flex-col justify-center lyrics-mask min-h-0">
          <div className="flex-1 flex flex-col items-center justify-center py-4">
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
                            className={`text-lg font-black italic tracking-tight leading-relaxed ${isActive ? "text-glow-green" : ""
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

        {/* ─── Controls ─── */}
        <div className="flex-none px-6 pb-6 pt-2 space-y-4 relative z-10">
          {/* Progress */}
          <div className="space-y-1.5 pt-2">
            <div className="relative h-[5px] group cursor-pointer flex items-center">
              {/* Background Track */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[3px] bg-white/6 rounded-full" />

              {/* Buffered Bar */}
              <div
                className="absolute top-1/2 -translate-y-1/2 left-0 h-[3px] bg-white/10 rounded-full transition-all duration-300 pointer-events-none"
                style={{ width: `${bufferedPct}%` }}
              />

              {/* Progress Bar (Visual) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 left-0 h-[3px] rounded-full group-hover:h-[5px] transition-all pointer-events-none"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, var(--primary), oklch(0.6 0.2 142))",
                }}
              />

              {/* Native Slider Input */}
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={localTime}
                onChange={handleSeekChange}
                className="modern-slider progress-slider"
              />
            </div>
            <div className="flex justify-between text-[9px] font-bold text-zinc-600 tabular-nums">
              <span>{formatTime(localTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Buttons */}
          <div className="flex items-center justify-center gap-7">
            <button
              onClick={() => {
                playerActions.toggleRepeat();
                const nextModeMap: Record<string, string> = { none: "all", all: "one", one: "none" };
                const nextMode = nextModeMap[repeatMode] || "none";
                toast.success("Repeat Mode Changed", {
                  description: `Mode: ${nextMode.charAt(0).toUpperCase() + nextMode.slice(1)}`,
                });
              }}
              className={`p-1.5 rounded-lg transition-all ${repeatMode !== "none"
                ? "text-primary"
                : "text-zinc-700 hover:text-zinc-400"
                }`}
            >
              <Repeat1 size={16} />
            </button>

            <button
              onClick={() => playerActions.previous()}
              className="text-zinc-500 hover:text-white transition-colors active:scale-90"
            >
              <SkipBack size={16} fill="currentColor" />
            </button>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => playerActions.setIsPlaying(!isPlaying)}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:shadow-[0_4px_30px_rgba(255,255,255,0.2)] transition-shadow"
            >
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-black/10 border-t-primary rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={20} fill="black" />
              ) : (
                <Play size={16} fill="black" className="ml-0.5" />
              )}
            </motion.button>

            <button
              onClick={() => playerActions.next()}
              className="text-zinc-500 hover:text-white transition-colors active:scale-90"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>

            <div className="relative group">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all border ${showQualityMenu
                  ? "bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/10"
                  : "bg-white/3 border-white/5 text-zinc-500 hover:text-white hover:bg-white/5"
                  }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider italic">
                  {selectedQuality === "auto" ? "AUTO" : `${Math.round((selectedQuality as number) / 1000)}K`}
                </span>
                <ChevronDown size={12} className={`transition-transform duration-300 ${showQualityMenu ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showQualityMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute bottom-full right-0 mb-3 w-40 glass-effect-strong border border-white/10 rounded-2xl p-2 shadow-2xl z-[100]"
                  >
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-1.5">
                      Stream Quality
                    </p>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                      <button
                        onClick={() => {
                          playerActions.setSelectedQuality("auto");
                          setShowQualityMenu(false);
                          toast.success("Quality: Auto", {
                            description: "Automatic quality adjustment enabled.",
                          });
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black italic transition-all mb-1 ${selectedQuality === "auto"
                          ? "bg-primary text-black shadow-lg shadow-primary/20"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                          }`}
                      >
                        AUTO
                      </button>
                      {qualityTracks.map((t: any) => (
                        <button
                          key={t.bandwidth}
                          onClick={() => {
                            playerActions.setSelectedQuality(t.bandwidth);
                            setShowQualityMenu(false);
                            toast.success("Quality Updated", {
                              description: `Streaming at ${Math.round(t.bandwidth / 1000)} kbps.`,
                            });
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black italic transition-all mb-1 ${selectedQuality === t.bandwidth
                            ? "bg-primary text-black shadow-lg shadow-primary/20"
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                          {Math.round(t.bandwidth / 1000)} KBPS
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Volume - Custom div-based slider */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => playerActions.setIsMuted(!isMuted)}
              className="text-zinc-600 hover:text-zinc-300 transition-colors flex-none"
            >
              <VolumeIcon size={14} />
            </button>
            <div className="flex-1 relative flex items-center h-4 group">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="modern-slider volume-slider"
                style={{ "--volume-percent": `${volumePct}%` } as any}
              />
            </div>
            <span className="text-[9px] font-bold text-zinc-700 tabular-nums w-7 text-right">
              {Math.round(volumePct)}
            </span>
          </div>


        </div>
      </div>

      {/* Playlist Picker Portal */}
      {currentSong && (
        <PlaylistPickerModal
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          songId={currentSong.id}
          songTitle={currentSong.title}
        />
      )}
    </>
  );
}
