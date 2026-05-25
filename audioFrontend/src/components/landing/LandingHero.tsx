"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Music,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { playerActions } from "@/store/player.store";
import { Interactive3DTiltCard } from "./Interactive3DTiltCard";

const lyricsData = [
  { time: 0, text: "🎵 [Instrumental Intro]" },
  { time: 21.2, text: "All I am is a man. I want the world in my" },
  { time: 27.6, text: "hands. I hate the beach but I stand" },
  { time: 32.54, text: "in California with my toes in the sand." },
  { time: 37.06, text: "my sweater. Let's have an adventure." },
  { time: 42.46, text: "gravity centered. Touch my neck and I'll touch yours." },
  { time: 49.18, text: "little high-waisted shorts. Oh, she knows what I think about" },
  { time: 55.62, text: "what I think about. One love, one house." },
  { time: 60.94, text: "No shirt, no shoes, just us." },
  { time: 65.56, text: "to tell you about, no. 'Cause it's too cold" },
  { time: 71.4, text: "for you here..." },
  { time: 79.16, text: "put both your hands in the holes of my sweater." },
  { time: 84.52, text: "If I may just take your breath away." },
  { time: 90.56, text: "so far away. The goosebumps start to race" },
  { time: 97.42, text: "my finger on your tongue, 'cause you love the taste, yeah." },
  { time: 104.54, text: "Inside this place is warm. Outside it starts to pour." },
  { time: 141.04, text: "'Cause it's too cold for you here..." },
  { time: 148.8, text: "in the holes of my sweater." },
  { time: 214.6, text: "both your hands in the holes of my sweater..." },
  { time: 235.86, text: "It's too cold, it's too cold." },
  { time: 240.42, text: "🎵 [Guitar Outro / Fade Out]" },
];

export function LandingHero() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mockQuality, setMockQuality] = useState<"standard" | "high" | "hifi">("hifi");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.65);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);

    const streamUrl =
      "https://audioprocessingproduction.s3.ap-south-1.amazonaws.com/audios/t_deae56148a414ec4ba3045dbff48e04d.7dbfa6008655518fee09b95441aea4ddb8349a3675c444f97862e4c38d087ca7/master.m3u8";

    let hlsInstance: any = null;
    const loadStream = async () => {
      try {
        const HlsModule = await import("hls.js");
        const Hls = HlsModule.default;
        if (Hls.isSupported()) {
          hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: false, maxBufferLength: 20, maxMaxBufferLength: 20 });
          hlsInstance.attachMedia(audio);
          hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => hlsInstance.loadSource(streamUrl));
          hlsInstance.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hlsInstance.startLoad();
              else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hlsInstance.recoverMediaError();
            }
          });
        } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
          audio.src = streamUrl;
        }
      } catch (err) {
        console.error("Failed to load Hls.js:", err);
      }
    };
    loadStream();

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      hlsInstance?.destroy();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const activeLyric = lyricsData.reduce(
    (acc, lyric) => (currentTime >= lyric.time ? lyric : acc),
    lyricsData[0]
  );
  const activeIndex = lyricsData.findIndex((l) => l.time === activeLyric.time);
  const prevLyric = activeIndex > 0 ? lyricsData[activeIndex - 1].text : "";
  const nextLyric = activeIndex < lyricsData.length - 1 ? lyricsData[activeIndex + 1].text : "";

  const formatTime = (t: number) => {
    if (isNaN(t)) return "0:00";
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  };

  return (
    <main className="max-w-6xl mx-auto px-6 pt-28 md:pt-36 pb-12 relative z-10 flex flex-col items-center">

      {/* Badge
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.2em]"
        style={{
          background: "rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Sparkles className="w-3 h-3 text-primary" />
        Precision Audio • HLS Streaming
      </motion.div> */}

      {/* Heading */}
      <div className="text-center max-w-3xl space-y-5 mb-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.92] text-zinc-900"
        >
          Acoustic Depth.<br />
          <span
            className="italic"
            style={{
              background: "linear-gradient(90deg, var(--primary) 0%, #34d399 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Impeccably Synced.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="text-base text-zinc-400 max-w-lg mx-auto leading-relaxed"
        >
          Decoded natively. Streamed adaptively. Experience premium, zero-buffer HLS
          streaming with real-time lyric synchronization.
        </motion.p>
      </div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="flex flex-col sm:flex-row items-center gap-3 mb-14"
      >
        <button
          onClick={() => playerActions.openAuthModal()}
          className="px-7 py-3.5 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-700 transition-colors active:scale-95 flex items-center gap-2 group cursor-pointer"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)" }}
        >
          Enter Console
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <a
          href="#features"
          className="px-7 py-3.5 rounded-xl text-sm font-bold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
          style={{
            background: "rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          Explore Features
        </a>
      </motion.div>

      {/* Player Card */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.8 }}
        className="w-full max-w-4xl"
      >
        <Interactive3DTiltCard
          className="w-full rounded-[2rem] p-6 md:p-8 relative overflow-hidden"
          style={{
            background: "rgba(10, 11, 10, 0.94)",
            backdropFilter: "blur(48px)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 32px 100px rgba(0,0,0,0.38), 0 1px 0 rgba(255,255,255,0.04) inset",
          } as React.CSSProperties}
        >
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/3 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">

            {/* Left: Vinyl + quality picker */}
            <div className="md:col-span-5 flex flex-col items-center gap-5">
              <div className="relative w-48 h-48 md:w-52 md:h-52 shrink-0 flex items-center justify-center">
                {/* Vinyl record */}
                <motion.div
                  animate={{ x: isPlaying ? "35%" : "0%", rotate: isPlaying ? 360 : 0 }}
                  transition={
                    isPlaying
                      ? { x: { type: "spring", stiffness: 90, damping: 15 }, rotate: { repeat: Infinity, duration: 8, ease: "linear" } }
                      : { x: { type: "spring", stiffness: 110, damping: 18 }, rotate: { duration: 0.5 } }
                  }
                  className="absolute w-44 h-44 md:w-52 md:h-52 rounded-full z-10 shadow-2xl flex items-center justify-center"
                  style={{
                    background: "radial-gradient(circle, #1c1c1e 30%, #09090b 70%)",
                    backgroundImage: "repeating-radial-gradient(circle, #27272a, #09090b 4px, #18181b 8px)",
                    border: "1px solid #27272a",
                  }}
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-black overflow-hidden relative flex items-center justify-center">
                    <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=250" className="w-full h-full object-cover rounded-full" alt="Vinyl Center" />
                    <div className="absolute w-3 h-3 rounded-full bg-zinc-950 border border-zinc-700" />
                  </div>
                </motion.div>

                {/* Album cover */}
                <div
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="relative w-44 h-44 md:w-52 md:h-52 rounded-[1.75rem] overflow-hidden shadow-2xl cursor-pointer z-20 ring-1 ring-white/8 hover:ring-primary/25 transition-all"
                >
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-all duration-300 flex items-center justify-center z-30">
                    {isPlaying ? <Pause className="w-10 h-10 text-primary fill-primary" /> : <Play className="w-10 h-10 text-primary fill-primary" />}
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=600"
                    className={`w-full h-full object-cover transition-transform duration-[1.5s] ${isPlaying ? "scale-105" : ""}`}
                    alt="Album Cover"
                  />
                  <div className="absolute bottom-3 left-3 z-30">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur text-[8px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 border border-white/5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                      </span>
                      HLS Live
                    </span>
                  </div>
                </div>
              </div>

              {/* Quality switcher */}
              <div
                className="flex gap-1 p-1 rounded-full w-full max-w-[200px]"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {(["standard", "high", "hifi"] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setMockQuality(q)}
                    className={`flex-1 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      mockQuality === q ? "bg-primary text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Info + controls */}
            <div className="md:col-span-7 space-y-4 text-left md:pl-2">
              {/* Track info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                    Sweater Weather
                    {isPlaying && <Music className="w-4 h-4 text-primary animate-bounce" />}
                  </h3>
                  <p className="text-xs text-primary/80 font-semibold uppercase tracking-widest mt-0.5">
                    The Neighbourhood • {mockQuality === "hifi" ? "FLAC" : mockQuality === "high" ? "AAC" : "MP3"}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {mockQuality === "hifi" ? "320kbps" : mockQuality === "high" ? "192kbps" : "128kbps"}
                </span>
              </div>

              {/* Lyrics */}
              <div
                className="rounded-xl p-4 min-h-[88px] flex flex-col justify-center gap-1.5 text-center relative overflow-hidden"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="absolute top-2 left-3.5 text-[7px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Real-time Lyrics</div>
                <p className="text-[10px] text-zinc-600 truncate px-3 opacity-60">{prevLyric || "•"}</p>
                <p className="text-sm text-primary font-semibold px-3 text-glow-green">{activeLyric.text}</p>
                <p className="text-[10px] text-zinc-600 truncate px-3 opacity-60">{nextLyric || "•"}</p>
              </div>

              {/* EQ waveform */}
              <div className="space-y-2">
                <div className="flex items-end gap-0.5 h-10 w-full">
                  {[15,35,20,60,45,50,30,80,55,65,25,40,60,75,50,35,65,85,40,50,30,70,20,55,45,75,50,35,60,20].map((val, idx) => (
                    <motion.div
                      key={idx}
                      className="rounded-full flex-1"
                      style={{ background: "linear-gradient(to top, rgba(120,240,142,0.3), var(--primary))" }}
                      animate={isPlaying ? { height: [`${val * 0.25}%`, `${val}%`, `${val * 0.4}%`, `${val * 0.25}%`] } : { height: `${val * 0.2}%` }}
                      transition={{ duration: 1.2 + (idx % 3) * 0.2, repeat: Infinity, ease: "easeInOut", delay: idx * 0.015 }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration || 252)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-black hover:scale-105 transition-all shadow-md shadow-primary/25 cursor-pointer shrink-0"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black ml-0.5" />}
                </button>

                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    if (audioRef.current && duration > 0) audioRef.current.currentTime = pct * duration;
                  }}
                  className="flex-1 h-1 rounded-full overflow-hidden cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.10)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                      background: "linear-gradient(90deg, var(--primary), #34d399)",
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setIsMuted(!isMuted)} className="cursor-pointer">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-zinc-600" /> : <Volume2 className="w-4 h-4 text-primary" />}
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.05" value={volume}
                    onChange={(e) => { setVolume(parseFloat(e.target.value)); if (isMuted) setIsMuted(false); }}
                    className="w-14 h-1 rounded-lg appearance-none cursor-pointer accent-primary"
                    style={{ background: "rgba(255,255,255,0.10)" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Interactive3DTiltCard>
      </motion.div>
    </main>
  );
}
