"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { playerStore, playerActions } from "@/store/player.store";
import { useStore } from "@tanstack/react-store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Music, 
  Zap, 
  Shield, 
  ArrowRight, 
  Disc, 
  Play, 
  Pause,
  Radio, 
  Volume2, 
  VolumeX,
  ListMusic, 
  Search, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Tv, 
  Headphones, 
  UserCheck, 
  History,
  Lock,
  Globe,
  RadioTower,
  Smartphone,
  Check,
  Cpu,
  Layers3,
  Server,
  ZapOff
} from "lucide-react";

// Lyrics aligned with "Sweater Weather" timeline
const lyricsData = [
  { time: 0, text: "🎵 [Instrumental Intro]" },
  { time: 21.2, text: "All I am is a man. I want the world in my" },
  { time: 27.6, text: "hands. I hate the beach but I stand" },
  { time: 32.54, text: "in California with my toes in the sand. Use the sleeves on" },
  { time: 37.06, text: "my sweater. Let's have an adventure. Head in the clouds but my" },
  { time: 42.46, text: "gravity centered. Touch my neck and I'll touch yours. You in those" },
  { time: 49.18, text: "little high-waisted shorts. Oh, she knows what I think about and" },
  { time: 55.62, text: "what I think about. One love, one house." },
  { time: 60.94, text: "No shirt, no shoes, just us. Find out nothing I don't want" },
  { time: 65.56, text: "to tell you about, no. 'Cause it's too cold" },
  { time: 71.4, text: "for you here..." },
  { time: 73.96, text: "And now, so let me..." },
  { time: 79.16, text: "put both your hands in the holes of my sweater." },
  { time: 84.52, text: "If I may just take your breath away. I don't mind if there's not much to" },
  { time: 87.28, text: "say. Sometimes the silence guides the mind to move to a place" },
  { time: 90.56, text: "so far away. The goosebumps start to race the minute that my" },
  { time: 94.24, text: "left hand meets your waist. And then I watch your face, put" },
  { time: 97.42, text: "my finger on your tongue, 'cause you love the taste, yeah." },
  { time: 100.34, text: "These hearts adore everyone the other beats hardest for." },
  { time: 104.54, text: "Inside this place is warm. Outside it starts to pour." },
  { time: 110.58, text: "Coming down. One love, one house." },
  { time: 116.1, text: "No shirt, no shoes, just us." },
  { time: 120.42, text: "Find out nothing I really want to tell you about, no." },
  { time: 125.62, text: "'Cause it's too cold for you here..." },
  { time: 128.32, text: "And now, so let me hold both your hands" },
  { time: 133.36, text: "in the holes of my sweater." },
  { time: 141.04, text: "'Cause it's too cold for you here..." },
  { time: 143.68, text: "And now, so let me hold both your hands" },
  { time: 148.8, text: "in the holes of my sweater." },
  { time: 202.84, text: "'Cause it's too cold..." },
  { time: 206.84, text: "for you here..." },
  { time: 209.4, text: "And now, so let me hold..." },
  { time: 214.6, text: "both your hands in the holes of my sweater..." },
  { time: 222.36, text: "For you here..." },
  { time: 225.38, text: "And now, let me hold both your hands" },
  { time: 230.1, text: "in the holes of my sweater." },
  { time: 235.86, text: "It's too cold, it's too cold." },
  { time: 240.42, text: "🎵 [Guitar Outro / Fade Out]" }
];

// Interactive 3D Cursor Tilt Component with Cursor Glare Reflectivity
function Interactive3DTiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 10, y: -y * 10 });
    setGlare({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateY: tilt.x,
        rotateX: tilt.y,
        scale: hovered ? 1.015 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1200,
      }}
      className={`${className} cursor-pointer relative overflow-hidden`}
    >
      {hovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-300 opacity-20 z-30"
          style={{
            background: `radial-gradient(circle 180px at ${glare.x}px ${glare.y}px, rgba(255, 255, 255, 0.15), transparent)`,
          }}
        />
      )}
      <div 
        style={{ transform: "translateZ(30px)" }}
        className="transition-transform duration-200 h-full w-full"
      >
        {children}
      </div>
    </motion.div>
  );
}

// Background drifting blob helper
const BackgroundBlob = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    animate={{
      x: [0, 60, -40, 0],
      y: [0, -70, 50, 0],
      scale: [1, 1.2, 0.85, 1],
    }}
    transition={{
      duration: 20,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
    className={`absolute rounded-full blur-[180px] pointer-events-none opacity-20 ${className}`}
  />
);

/* ─── Bento Grid Visualizers ─── */

// 1. Segment Streamer Demo
function SegmentStreamerDemo() {
  const [segments, setSegments] = useState([
    { name: "Segment 1", status: "loaded", size: "840KB" },
    { name: "Segment 2", status: "loaded", size: "910KB" },
    { name: "Segment 3", status: "buffering", size: "780KB" },
    { name: "Segment 4", status: "idle", size: "820KB" },
    { name: "Segment 5", status: "idle", size: "850KB" },
  ]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSegments(prev => {
        const bufferingIdx = prev.findIndex(s => s.status === "buffering");
        if (bufferingIdx === -1) {
          return prev.map((s, idx) => ({ ...s, status: idx === 0 ? "buffering" : "idle" }));
        }
        return prev.map((s, idx) => {
          if (idx === bufferingIdx) return { ...s, status: "loaded" };
          if (idx === (bufferingIdx + 1) % prev.length) return { ...s, status: "buffering" };
          if (idx > (bufferingIdx + 1) % prev.length && idx !== bufferingIdx) return { ...s, status: "idle" };
          return s;
        });
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2.5 w-full max-w-[280px] p-4 bg-zinc-950/60 border border-white/5 rounded-2xl shadow-inner">
      <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-zinc-500">
        <span>Active HLS Buffers</span>
        <span className="text-primary animate-pulse">Live Segmenting</span>
      </div>
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-white/3 border border-white/5 rounded-xl text-[10px] transition-all duration-300">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                seg.status === "loaded" ? "bg-primary shadow-[0_0_8px_var(--primary)]" :
                seg.status === "buffering" ? "bg-emerald-400 animate-pulse" : "bg-zinc-700"
              }`} />
              <span className={`font-semibold tracking-tight ${seg.status === "idle" ? "text-zinc-500" : "text-white"}`}>
                {seg.name}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[8px] font-bold text-zinc-500">
              <span>{seg.size}</span>
              <span className={`px-1 py-0.5 rounded text-[7px] font-black uppercase ${
                seg.status === "loaded" ? "bg-primary/10 text-primary" :
                seg.status === "buffering" ? "bg-emerald-400/10 text-emerald-400" : "bg-zinc-800 text-zinc-600"
              }`}>
                {seg.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Cryptographic OTP Verification
function OtpDemo() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    let isMounted = true;
    const typeSequence = async () => {
      while (isMounted) {
        setStatus("typing");
        const targetDigits = ["7", "2", "0", "9", "4", "5"];
        for (let i = 0; i < 6; i++) {
          if (!isMounted) return;
          await new Promise(r => setTimeout(r, 450));
          setDigits(prev => {
            const next = [...prev];
            next[i] = targetDigits[i];
            return next;
          });
        }
        if (!isMounted) return;
        await new Promise(r => setTimeout(r, 300));
        setStatus("success");
        await new Promise(r => setTimeout(r, 2200));
        if (!isMounted) return;
        setStatus("resetting");
        setDigits(["", "", "", "", "", ""]);
        await new Promise(r => setTimeout(r, 600));
      }
    };
    typeSequence();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-zinc-950/60 border border-white/5 rounded-2xl w-full max-w-[210px] mx-auto shadow-inner">
      <div className="flex gap-1.5">
        {digits.map((d, i) => (
          <div key={i} className={`w-7 h-9 rounded-lg border flex items-center justify-center text-xs font-black transition-all ${
            status === "success" ? "border-primary text-primary bg-primary/5 shadow-[0_0_8px_rgba(120,240,142,0.1)]" :
            d ? "border-white/20 text-white bg-white/5" : "border-white/5 bg-zinc-900/50 text-zinc-700"
          }`}>
            {d}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {status === "success" ? (
          <div className="flex items-center gap-1 text-[8px] font-black text-primary uppercase tracking-[0.15em]">
            <Check className="w-3 h-3" />
            <span>HMAC VERIFIED</span>
          </div>
        ) : (
          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.15em] animate-pulse">
            {status === "typing" ? "HASHING OTP..." : "AWAITING..."}
          </span>
        )}
      </div>
    </div>
  );
}

// 3. Global Catalog Search
function SearchDemo() {
  const [query, setQuery] = useState("");
  const [activeResult, setActiveResult] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const animateSearch = async () => {
      while (isMounted) {
        const text = "Tame Impala";
        setQuery("");
        setActiveResult(false);
        await new Promise(r => setTimeout(r, 600));
        
        for (let i = 0; i <= text.length; i++) {
          if (!isMounted) return;
          setQuery(text.substring(0, i));
          await new Promise(r => setTimeout(r, 140));
        }
        if (!isMounted) return;
        await new Promise(r => setTimeout(r, 450));
        setActiveResult(true);
        await new Promise(r => setTimeout(r, 3200));
      }
    };
    animateSearch();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full max-w-[210px] mx-auto p-4 bg-zinc-950/60 border border-white/5 rounded-2xl space-y-2.5 shadow-inner">
      <div className="flex items-center gap-2 bg-zinc-900/50 border border-white/10 rounded-xl px-3 py-1.5 text-[10px]">
        <Search size={10} className="text-zinc-500" />
        <div className="text-white font-semibold truncate border-r border-primary pr-0.5 animate-pulse min-h-[14px]">
          {query || <span className="text-zinc-600">Search library...</span>}
        </div>
      </div>
      <AnimatePresence>
        {activeResult && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="p-1.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded bg-zinc-800 shrink-0 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=60" className="w-full h-full object-cover" alt="Tame Impala" />
            </div>
            <div className="truncate text-left min-w-0">
              <h4 className="text-[9px] font-black text-white uppercase italic tracking-tight">Let It Happen</h4>
              <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">Tame Impala</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 4. Equalizer Preset Customizer
function EqualizerDemo() {
  const [preset, setPreset] = useState<"boost" | "vocal" | "acoustic">("boost");
  
  const heights = {
    boost: [20, 50, 75, 95, 80, 55, 35, 25, 15, 10],
    vocal: [8, 15, 35, 55, 85, 95, 75, 50, 30, 15],
    acoustic: [18, 38, 50, 58, 62, 68, 72, 58, 42, 28]
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full max-w-sm p-4 bg-zinc-950/60 border border-white/5 rounded-2xl shadow-inner">
      <div className="flex sm:flex-col gap-1.5 shrink-0 w-full sm:w-auto">
        {(["boost", "vocal", "acoustic"] as const).map(p => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              preset === p ? "bg-primary text-black shadow-lg shadow-primary/10" : "bg-white/3 text-zinc-500 hover:text-white"
            }`}
          >
            {p === "boost" ? "Bass Boost" : p === "vocal" ? "Vocal Clear" : "Acoustic"}
          </button>
        ))}
      </div>
      
      <div className="flex gap-1.5 items-end justify-center w-full h-20 bg-black/40 border border-white/5 rounded-xl p-3">
        {heights[preset].map((h, i) => (
          <motion.div
            key={i}
            animate={{ height: [`${h * 0.35}%`, `${h}%`, `${h * 0.55}%`, `${h * 0.35}%`] }}
            transition={{ repeat: Infinity, duration: 1.1 + (i % 3) * 0.25, ease: "easeInOut" }}
            className="bg-gradient-to-t from-primary via-emerald-400 to-green-300 rounded-full flex-1 min-w-[3px]"
          />
        ))}
      </div>
    </div>
  );
}

// 5. Playlist Creation
function PlaylistDemo() {
  const [playlists, setPlaylists] = useState([
    { name: "Late Night Beats", count: 14 },
    { name: "Acoustic Session", count: 9 },
  ]);
  const [typing, setTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    let isMounted = true;
    const animatePlaylist = async () => {
      while (isMounted) {
        await new Promise(r => setTimeout(r, 1600));
        setTyping(true);
        const name = "Dark Ambient";
        for (let i = 0; i <= name.length; i++) {
          if (!isMounted) return;
          setInputValue(name.substring(0, i));
          await new Promise(r => setTimeout(r, 130));
        }
        await new Promise(r => setTimeout(r, 500));
        if (!isMounted) return;
        setPlaylists(prev => [...prev, { name: "Dark Ambient", count: 0 }]);
        setInputValue("");
        setTyping(false);
        await new Promise(r => setTimeout(r, 3800));
        if (!isMounted) return;
        setPlaylists([
          { name: "Late Night Beats", count: 14 },
          { name: "Acoustic Session", count: 9 },
        ]);
      }
    };
    animatePlaylist();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full max-w-[210px] mx-auto p-4 bg-zinc-950/60 border border-white/5 rounded-2xl space-y-2.5 shadow-inner">
      <div className="flex items-center justify-between text-[8px] font-black uppercase text-zinc-500 tracking-wider">
        <span>My Playlists</span>
        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 cursor-pointer hover:bg-primary hover:text-black transition-colors">
          +
        </div>
      </div>
      <div className="space-y-1">
        {playlists.map((pl, i) => (
          <motion.div
            layout
            key={pl.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-1.5 bg-white/3 border border-white/5 rounded-lg text-[10px]"
          >
            <div className="flex items-center gap-1.5">
              <ListMusic size={10} className="text-primary" />
              <span className="font-bold text-white tracking-tight">{pl.name}</span>
            </div>
            <span className="text-[7px] font-mono text-zinc-500 font-bold">{pl.count} tracks</span>
          </motion.div>
        ))}
        {typing && (
          <div className="flex items-center justify-between p-1.5 bg-primary/5 border border-primary/20 rounded-lg text-[10px]">
            <div className="flex items-center gap-1.5">
              <ListMusic size={10} className="text-primary animate-pulse" />
              <span className="font-bold text-primary tracking-tight border-r border-primary pr-0.5 animate-pulse">
                {inputValue}
              </span>
            </div>
            <span className="text-[7px] font-black text-primary uppercase tracking-widest">Typing</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 6. Recommendation Network
function RecommendationDemo() {
  const genres = [
    { name: "Synthwave", x: 12, y: 20, color: "rgba(120,240,142,0.6)" },
    { name: "Indie Rock", x: 74, y: 15, color: "rgba(34,197,94,0.6)" },
    { name: "Ambient", x: 18, y: 72, color: "rgba(16,185,129,0.6)" },
    { name: "Lo-Fi", x: 78, y: 68, color: "rgba(52,211,153,0.6)" }
  ];

  return (
    <div className="relative w-full max-w-[210px] h-28 mx-auto bg-zinc-950/60 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center p-3 shadow-inner">
      <div className="absolute w-8 h-8 rounded-full bg-zinc-900 border border-primary/30 flex items-center justify-center z-20 shadow-[0_0_12px_rgba(120,240,142,0.15)]">
        <Headphones size={12} className="text-primary animate-pulse" />
      </div>
      
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <line x1="50%" y1="50%" x2="25%" y2="28%" stroke="rgba(120,240,142,0.15)" strokeWidth="1.2" />
        <line x1="50%" y1="50%" x2="78%" y2="23%" stroke="rgba(120,240,142,0.15)" strokeWidth="1.2" />
        <line x1="50%" y1="50%" x2="30%" y2="70%" stroke="rgba(120,240,142,0.15)" strokeWidth="1.2" />
        <line x1="50%" y1="50%" x2="78%" y2="68%" stroke="rgba(120,240,142,0.15)" strokeWidth="1.2" />
      </svg>

      {genres.map((g, i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 2.2 + i * 0.4, ease: "easeInOut" }}
          className="absolute px-2 py-0.5 rounded-full border border-white/5 text-[7px] font-black uppercase tracking-wider text-white z-20 bg-zinc-900/90 shadow-md"
          style={{ left: `${g.x}%`, top: `${g.y}%`, borderColor: g.color }}
        >
          {g.name}
        </motion.div>
      ))}
    </div>
  );
}


export default function Home() {
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Mock player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [mockQuality, setMockQuality] = useState<"standard" | "high" | "hifi">("hifi");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.65);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && systemUser) {
      router.push("/home");
    }
  }, [isMounted, systemUser, router]);

  // Sync real audio playback
  useEffect(() => {
    if (!isMounted) return;

    const audio = new Audio();
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);

    const streamUrl = "https://audioprocessingproduction.s3.ap-south-1.amazonaws.com/audios/t_deae56148a414ec4ba3045dbff48e04d.7dbfa6008655518fee09b95441aea4ddb8349a3675c444f97862e4c38d087ca7/master.m3u8";

    let hlsInstance: any = null;

    const loadStream = async () => {
      try {
        if (audio.canPlayType("application/vnd.apple.mpegurl")) {
          audio.src = streamUrl;
        } else {
          const HlsModule = await import("hls.js");
          const Hls = HlsModule.default;
          if (Hls.isSupported()) {
            hlsInstance = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
            });
            hlsInstance.attachMedia(audio);
            hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
              hlsInstance.loadSource(streamUrl);
            });
            hlsInstance.on(Hls.Events.ERROR, (event: any, data: any) => {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    hlsInstance.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hlsInstance.recoverMediaError();
                    break;
                  default:
                    break;
                }
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to load Hls.js library:", err);
      }
    };

    loadStream();

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      audioRef.current = null;
    };
  }, [isMounted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.log("Autoplay blocked or audio load error:", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Dynamic lyric matching based on currentTime
  const activeLyric = lyricsData.reduce((acc, lyric) => {
    if (currentTime >= lyric.time) {
      return lyric;
    }
    return acc;
  }, lyricsData[0]);

  const activeIndex = lyricsData.findIndex((l) => l.time === activeLyric.time);
  const prevLyric = activeIndex > 0 ? lyricsData[activeIndex - 1].text : "";
  const nextLyric = activeIndex < lyricsData.length - 1 ? lyricsData[activeIndex + 1].text : "";

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!isMounted || systemUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-pulse text-zinc-500 font-semibold text-sm tracking-[0.25em] uppercase italic">
          Initializing Soundscape...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 overflow-y-auto relative font-sans no-scrollbar pb-16">
      
      {/* Mesh Grid Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* Premium Ambient Background Blur Nodes */}
      <BackgroundBlob className="top-[-5%] left-[-5%] w-[45%] h-[45%] bg-primary/12" delay={0} />
      <BackgroundBlob className="bottom-[15%] right-[-5%] w-[55%] h-[55%] bg-emerald-400/5" delay={4} />
      <BackgroundBlob className="top-[35%] left-[25%] w-[35%] h-[35%] bg-primary/6" delay={2} />

      {/* Floating Glassmorphic Header Capsule */}
      <header className="fixed top-6 inset-x-6 z-50 max-w-5xl mx-auto rounded-full backdrop-blur-xl bg-black/40 border border-white/5 px-6 py-3 flex items-center justify-between shadow-2xl">
        <div 
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => router.push("/")}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <Radio className="w-4 h-4 text-black animate-pulse" />
          </div>
          <span className="text-sm font-black tracking-widest bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent italic uppercase text-glow-green">
            ONE MELODY
          </span>
        </div>

        {/* Apple style navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#specs" className="hover:text-primary transition-colors">Specs</a>
          <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => playerActions.openAuthModal()}
            className="relative group px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest overflow-hidden transition-all duration-300 active:scale-95 cursor-pointer shadow-lg"
          >
            <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-full group-hover:bg-white/10 group-hover:border-primary/40 transition-all duration-300" />
            <span className="relative text-white group-hover:text-primary transition-colors">Listen Now</span>
          </button>
        </div>
      </header>
 
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-36 md:pt-44 pb-20 relative z-10 flex flex-col items-center">
        
        {/* Floating Glowing Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/3 border border-white/5 backdrop-blur-2xl mb-8 text-[8px] font-black text-primary uppercase tracking-[0.25em] shadow-inner"
        >
          <Sparkles className="w-3 h-3 text-primary animate-spin-slow" />
          <span>PRECISION AUDIO HARDWARE INTEGRATION</span>
        </motion.div>

        {/* Master Heading */}
        <div className="text-center max-w-4xl space-y-6 mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="text-5xl sm:text-7xl md:text-[5.5rem] font-black tracking-tighter leading-[0.95] bg-gradient-to-b from-white via-white to-zinc-600 bg-clip-text text-transparent italic uppercase"
          >
            Acoustic Depth.<br />
            <span className="bg-gradient-to-r from-primary via-emerald-400 to-green-300 bg-clip-text text-transparent">
              Impeccably Synced.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-sm md:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed font-light px-4"
          >
            Decoded natively. Streamed adaptively. Experience premium, zero-buffer HLS streaming with real-time text synchronization.
          </motion.p>
        </div>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-sm mb-20 px-4"
        >
          <button
            onClick={() => playerActions.openAuthModal()}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-emerald-400 text-black rounded-2xl hover:brightness-110 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/15 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
          >
            Enter Console
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 bg-white/3 border border-white/5 text-white rounded-2xl hover:bg-white/8 hover:border-primary/25 transition-all font-black text-xs uppercase tracking-widest text-center cursor-pointer"
          >
            Tech Stack
          </a>
        </motion.div>

        {/* Interactive 3D Audio Deck (Mockup Player) */}
        <div className="w-full max-w-4xl px-4 mb-24">
          <Interactive3DTiltCard className="w-full rounded-[2.5rem] border border-white/10 bg-zinc-900/10 p-6 md:p-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden group hover:border-primary/20 transition-colors duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Sliding Vinyl Sleeve & Record */}
              <div className="md:col-span-5 flex flex-col items-center gap-6">
                <div className="relative w-48 h-48 md:w-56 md:h-56 shrink-0 flex items-center justify-center">
                  
                  {/* Vinyl Record */}
                  <motion.div
                    animate={{
                      x: isPlaying ? "35%" : "0%",
                      rotate: isPlaying ? 360 : 0
                    }}
                    transition={isPlaying ? {
                      x: { type: "spring", stiffness: 90, damping: 15 },
                      rotate: { repeat: Infinity, duration: 8, ease: "linear" }
                    } : {
                      x: { type: "spring", stiffness: 110, damping: 18 },
                      rotate: { duration: 0.5 }
                    }}
                    className="absolute w-44 h-44 md:w-52 md:h-52 rounded-full z-10 shadow-2xl flex items-center justify-center border border-zinc-900"
                    style={{
                      background: "radial-gradient(circle, #18181b 30%, #09090b 70%)",
                      backgroundImage: "repeating-radial-gradient(circle, #27272a, #09090b 4px, #18181b 8px)"
                    }}
                  >
                    {/* Center label */}
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-black overflow-hidden relative flex items-center justify-center">
                      <img
                        src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=250"
                        className="w-full h-full object-cover rounded-full"
                        alt="Vinyl Center"
                      />
                      {/* Spindle hole */}
                      <div className="absolute w-3 h-3 rounded-full bg-zinc-950 border border-zinc-700 shadow-inner" />
                    </div>
                  </motion.div>

                  {/* Album Cover Sleeve */}
                  <div 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="relative w-44 h-44 md:w-52 md:h-52 rounded-[2rem] overflow-hidden shadow-2xl group/album cursor-pointer ring-1 ring-white/10 z-20 transition-all hover:ring-primary/20"
                  >
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/album:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px] z-30">
                      {isPlaying ? (
                        <Pause className="w-10 h-10 text-primary fill-primary animate-pulse" />
                      ) : (
                        <Play className="w-10 h-10 text-primary fill-primary" />
                      )}
                    </div>
                    <img 
                      src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=600" 
                      className={`w-full h-full object-cover transition-transform duration-[1.5s] ${isPlaying ? "scale-105" : ""}`} 
                      alt="Mock Album Cover" 
                    />
                    
                    {/* Floating Live Segment Indicator */}
                    <div className="absolute bottom-4 left-4 z-30">
                      <span className="px-3 py-1 rounded-xl bg-zinc-950/80 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 shadow-md border border-white/5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75`}></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                        </span>
                        HLS Sync
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simulated Stream Profile Switcher */}
                <div className="flex gap-1.5 bg-black/50 border border-white/5 rounded-full p-1 w-full max-w-[210px] justify-between shadow-inner z-20">
                  {(["standard", "high", "hifi"] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setMockQuality(q)}
                      className={`flex-1 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        mockQuality === q 
                          ? "bg-primary text-black shadow-lg shadow-primary/10" 
                          : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Song Information & Equalizer Visualizer */}
              <div className="md:col-span-7 space-y-5 text-left md:pl-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl md:text-2.5xl font-black tracking-tight text-white italic uppercase flex items-center gap-3">
                      Sweater Weather
                      {isPlaying && <Music className="w-4 h-4 text-primary animate-bounce" />}
                    </h3>
                    <p className="text-primary font-black uppercase tracking-widest text-[9px] italic">
                      The Neighbourhood • {mockQuality === "hifi" ? "HIFI FLAC Stream" : mockQuality === "high" ? "AAC Stream" : "MP3 Stream"}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                    {mockQuality === "hifi" ? "320kbps" : mockQuality === "high" ? "192kbps" : "128kbps"}
                  </div>
                </div>

                {/* Synced Lyrics Monitor (Fades previous/next lines) */}
                <div className="bg-black/50 border border-white/5 rounded-2xl p-4.5 min-h-[95px] flex flex-col justify-center gap-1.5 text-center relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-2.5 left-4 text-[7px] text-zinc-600 font-black uppercase tracking-[0.2em]">Real-time Telemetry</div>
                  
                  <div className="text-[10px] text-zinc-500 font-medium tracking-tight opacity-40 transition-opacity duration-300 truncate px-4">
                    {prevLyric || "•"}
                  </div>
                  <div className="text-sm md:text-base text-primary font-bold tracking-tight text-glow-green transition-all duration-300 px-4">
                    {activeLyric.text}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium tracking-tight opacity-40 transition-opacity duration-300 truncate px-4">
                    {nextLyric || "•"}
                  </div>
                </div>

                {/* Simulated Segment Equalizer Waveform */}
                <div className="space-y-2.5">
                  <div className="flex items-end gap-1 h-12 w-full">
                    {[15, 35, 20, 60, 45, 50, 30, 80, 55, 65, 25, 40, 60, 75, 50, 35, 65, 85, 40, 50, 30, 70, 20, 55, 45, 75, 50, 35, 60, 20].map((val, idx) => (
                      <motion.div 
                        key={idx}
                        className="bg-gradient-to-t from-primary/30 to-primary rounded-full flex-1"
                        animate={isPlaying ? { height: [`${val * 0.25}%`, `${val}%`, `${val * 0.4}%`, `${val * 0.25}%`] } : { height: `${val * 0.25}%` }}
                        transition={{ 
                          duration: 1.2 + (idx % 3) * 0.2, 
                          repeat: Infinity, 
                          ease: "easeInOut",
                          delay: idx * 0.015
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase tracking-widest font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration || 252)}</span>
                  </div>
                </div>

                {/* Dynamic Controls Bar */}
                <div className="flex items-center gap-4">
                  
                  {/* Play/Pause Button */}
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black hover:scale-105 transition-all shadow-lg shadow-primary/20 cursor-pointer shrink-0"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 text-black fill-black" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-black fill-black ml-0.5" />
                    )}
                  </button>

                  {/* Progress Seek Bar */}
                  <div 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percent = (e.clientX - rect.left) / rect.width;
                      if (audioRef.current && duration > 0) {
                        audioRef.current.currentTime = percent * duration;
                      }
                    }}
                    className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer relative group"
                  >
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-100" 
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>

                  {/* Interactive Volume Bar */}
                  <div className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors shrink-0">
                    <button onClick={() => setIsMuted(!isMuted)} className="cursor-pointer">
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-zinc-500" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-primary" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => {
                        const vol = parseFloat(e.target.value);
                        setVolume(vol);
                        if (isMuted) setIsMuted(false);
                      }}
                      className="w-14 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                      style={{ WebkitAppearance: "none" }}
                    />
                  </div>
                </div>

              </div>
            </div>
          </Interactive3DTiltCard>
        </div>
      </main>

      {/* Asymmetric Bento Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5 relative z-10">
        
        {/* Apple Style Section Headers */}
        <div className="text-center space-y-3 mb-20">
          <h2 className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">Capabilities Spec Sheet</h2>
          <p className="text-3xl md:text-5xl font-black tracking-tight italic uppercase leading-none">
            Asymmetric Hardware.<br />
            Precise Delivery.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Card 1: HLS Segment Loading (col-span-12 md:col-span-8) */}
          <div className="col-span-12 md:col-span-8">
            <Interactive3DTiltCard className="h-full rounded-[2rem] border border-white/5 bg-zinc-900/10 backdrop-blur-3xl p-8 flex flex-col md:flex-row gap-8 items-center justify-between group hover:border-primary/20 transition-all duration-500">
              <div className="space-y-3 text-left max-w-sm">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-300">
                  <RadioTower className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Adaptive HLS Segmenting</h3>
                <p className="text-zinc-400 leading-relaxed text-xs">
                  Audio tracks are packaged as chunk segments (`.m3u8` playlists) loaded on demand. Failsafe buffers recover network drops automatically.
                </p>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <SegmentStreamerDemo />
              </div>
            </Interactive3DTiltCard>
          </div>

          {/* Card 2: Passwordless OTP Validation (col-span-12 md:col-span-4) */}
          <div className="col-span-12 md:col-span-4">
            <Interactive3DTiltCard className="h-full rounded-[2rem] border border-white/5 bg-zinc-900/10 backdrop-blur-3xl p-8 flex flex-col justify-between gap-6 group hover:border-primary/20 transition-all duration-500">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-300">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-3 text-left">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">HMAC OTP Security</h3>
                <p className="text-zinc-400 leading-relaxed text-xs">
                  Cryptographically secure passwordless credentials using temporary HMAC-signed passcode nodes cached in ioredis.
                </p>
              </div>
              <div>
                <OtpDemo />
              </div>
            </Interactive3DTiltCard>
          </div>

          {/* Card 3: Global Catalog Search (col-span-12 md:col-span-4) */}
          <div className="col-span-12 md:col-span-4">
            <Interactive3DTiltCard className="h-full rounded-[2rem] border border-white/5 bg-zinc-900/10 backdrop-blur-3xl p-8 flex flex-col justify-between gap-6 group hover:border-primary/20 transition-all duration-500">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-300">
                <Globe className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-3 text-left">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Algolia Catalog</h3>
                <p className="text-zinc-400 leading-relaxed text-xs">
                  Search across a global music archive index with fuzzy spelling correction and instant autocomplete response.
                </p>
              </div>
              <div>
                <SearchDemo />
              </div>
            </Interactive3DTiltCard>
          </div>

          {/* Card 4: Equalizer preset canvas (col-span-12 md:col-span-8) */}
          <div className="col-span-12 md:col-span-8">
            <Interactive3DTiltCard className="h-full rounded-[2rem] border border-white/5 bg-zinc-900/10 backdrop-blur-3xl p-8 flex flex-col md:flex-row gap-8 items-center justify-between group hover:border-primary/20 transition-all duration-500">
              <div className="space-y-3 text-left max-w-sm">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-300">
                  <Sliders className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Lossless Custom EQ</h3>
                <p className="text-zinc-400 leading-relaxed text-xs">
                  Tune the sound vectors with our preset equalizers. Choose between Bass Boost, Vocal Clarifier, and Acoustic presets.
                </p>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <EqualizerDemo />
              </div>
            </Interactive3DTiltCard>
          </div>

          {/* Card 5: Playlist Creator (col-span-12 md:col-span-6) */}
          <div className="col-span-12 md:col-span-6">
            <Interactive3DTiltCard className="h-full rounded-[2rem] border border-white/5 bg-zinc-900/10 backdrop-blur-3xl p-8 flex flex-col justify-between gap-6 group hover:border-primary/20 transition-all duration-500">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-300">
                <ListMusic className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-3 text-left">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Synchronized Playlists</h3>
                <p className="text-zinc-400 leading-relaxed text-xs">
                  Add tracks instantly with a single button click in the left sidebar, automatically writing metadata to database schema.
                </p>
              </div>
              <div>
                <PlaylistDemo />
              </div>
            </Interactive3DTiltCard>
          </div>

          {/* Card 6: AI Node recommendation (col-span-12 md:col-span-6) */}
          <div className="col-span-12 md:col-span-6">
            <Interactive3DTiltCard className="h-full rounded-[2rem] border border-white/5 bg-zinc-900/10 backdrop-blur-3xl p-8 flex flex-col justify-between gap-6 group hover:border-primary/20 transition-all duration-500">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all duration-300">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-3 text-left">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">AI Curation Clusters</h3>
                <p className="text-zinc-400 leading-relaxed text-xs">
                  Acoustic pattern discovery engines connect history logs to suggest custom listening spheres matching your tastes.
                </p>
              </div>
              <div>
                <RecommendationDemo />
              </div>
            </Interactive3DTiltCard>
          </div>

        </div>
      </section>

      {/* Tech Specs & Architecture Section */}
      <section id="specs" className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5 relative z-10">
        
        <div className="text-center space-y-3 mb-20">
          <h2 className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">TECHNICAL SPECIFICATIONS</h2>
          <p className="text-3xl md:text-5xl font-black tracking-tight italic uppercase">ENGINEERING TOPOLOGY</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Spec values table (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-900/10 border border-white/5 rounded-[2rem] p-8 backdrop-blur-3xl">
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-white mb-6">Metrics Comparison</h3>
            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-zinc-500">STREAM LATENCY</span>
                <span className="text-primary font-black uppercase tracking-widest text-glow-green">SUB-100MS</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-zinc-500">AUDIO FORMAT</span>
                <span className="text-white font-black uppercase tracking-widest">320KBPS FLAC / AAC</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-zinc-500">SESSION CACHE</span>
                <span className="text-white font-black uppercase tracking-widest">IOREDIS MEMORY</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-zinc-500">DATABASE HANDSHAKE</span>
                <span className="text-primary font-black uppercase tracking-widest text-glow-green">NEON PG (SERVERLESS)</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-zinc-500">DELIVERY STORAGE</span>
                <span className="text-white font-black uppercase tracking-widest">AWS S3 EDGE CDN</span>
              </div>
            </div>
          </div>

          {/* Architectural flowchart (col-span-7) */}
          <div className="lg:col-span-7 bg-zinc-900/10 border border-white/5 rounded-[2rem] p-8 backdrop-blur-3xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-white mb-2">Architectural Blueprint</h3>
              <p className="text-zinc-500 text-xs font-light leading-relaxed mb-8">
                How media and session tokens travel securely across our hybrid edge serverless stack.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Cpu size={14} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-tight">Transcode</h4>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest leading-none font-medium">HLS PACKAGING</p>
                </div>
              </div>

              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Server size={14} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-tight">S3 Storage</h4>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest leading-none font-medium">AWS DEPLOYMENT</p>
                </div>
              </div>

              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Layers3 size={14} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-tight">ioredis</h4>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest leading-none font-medium">SESSION CACHE</p>
                </div>
              </div>

              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Radio size={14} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-tight">Hls.js client</h4>
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest leading-none font-medium">DECODED LIVE</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Platform FAQ Accordion */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-24 border-t border-white/5 relative z-10">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">SUPPORT ENQUIRIES</h2>
          <p className="text-3xl font-black tracking-tight italic uppercase">DECODER SPECS</p>
        </div>

        <div className="space-y-1 bg-zinc-900/10 border border-white/5 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-3xl">
          <FAQItem 
            question="What is Adaptive HLS Audio Streaming?"
            answer="Adaptive HTTP Live Streaming (HLS) breaks audio files into short segments and distributes them using .m3u8 index playlists. The player automatically monitors network performance and seamlessly changes bitrates (128kbps, 192kbps, or 320kbps HIFI FLAC) on-the-fly to guarantee zero lag, zero buffering, and maximum audio quality."
          />
          <FAQItem 
            question="Can I create my own playlists and add songs?"
            answer="Yes! Once you log in, you can create and manage playlists. Adding any track to your playlist takes a single click. You can reorder lists, manage your current listening queue, and save your favorite songs."
          />
          <FAQItem 
            question="How does passwordless OTP verification work?"
            answer="Instead of passwords, OneMelody uses Secure email verification. We send a 6-digit cryptographic passcode via email, which you enter on the platform. The passcode expires in 5 minutes and uses secure HMAC hashing, ensuring your login is quick and highly secure."
          />
          <FAQItem 
            question="Is my streaming synced across devices?"
            answer="Absolutely. Your favorites, custom playlists, and listening history are linked to your account and sync seamlessly. When you switch devices, your profile, queue state, and playlists remain exactly how you left them."
          />
        </div>
      </section>

      {/* Hero CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 z-10 relative">
        <div className="p-12 md:p-20 rounded-[3rem] bg-gradient-to-r from-primary/10 to-emerald-950/20 border border-white/5 text-center space-y-8 relative overflow-hidden">
          <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[150%] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
          
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tight leading-none text-white relative z-10">
            Hear the Difference.
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm max-w-sm mx-auto font-light relative z-10 leading-relaxed">
            Create an account with your email and access personalized, buffer-free audio frequencies anywhere.
          </p>
          <div className="flex justify-center relative z-10">
            <button
              onClick={() => playerActions.openAuthModal()}
              className="px-8 py-4 bg-gradient-to-r from-primary to-emerald-400 text-black rounded-2xl hover:brightness-110 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/15 active:scale-95 flex items-center gap-2 group cursor-pointer"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-white/5 text-zinc-600 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
        <div className="flex items-center gap-2.5 text-[10px] font-semibold">
          <div className="w-6.5 h-6.5 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
            <Radio className="w-3 h-3 text-primary animate-pulse" />
          </div>
          <span>© 2026 One Melody. Precision engineered sound.</span>
        </div>
        <div className="flex gap-6 text-[8px] font-black uppercase tracking-widest italic">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
          <a href="#" className="hover:text-white transition-colors">Discord</a>
        </div>
      </footer>
    </div>
  );
}

// FAQ item accordion component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 py-4 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-black text-sm md:text-base text-white hover:text-primary transition-colors py-1.5 cursor-pointer uppercase italic tracking-tighter"
      >
        <span>{question}</span>
        {isOpen ? (
          <ChevronUp className="w-4.5 h-4.5 text-primary shrink-0 ml-4" />
        ) : (
          <ChevronDown className="w-4.5 h-4.5 text-zinc-500 shrink-0 ml-4" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-zinc-400 text-xs mt-3 leading-relaxed font-light">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
