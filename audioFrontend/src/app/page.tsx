"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  ListMusic, 
  Search, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Tv, 
  Headphones, 
  UserCheck, 
  History 
} from "lucide-react";

export default function Home() {
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Mock player states
  const [isPlaying, setIsPlaying] = useState(true);
  const [mockQuality, setMockQuality] = useState<"standard" | "high" | "hifi">("hifi");
  const [lyricIndex, setLyricIndex] = useState(0);

  const lyricLines = [
    "And now let me hold...",
    "Both your hands in the holes of my sweater...",
    "And it's too cold, it's too cold...",
    "The wind is blowing, the leaves are falling...",
    "Cause it's too cold for you here..."
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && systemUser) {
      router.push("/home");
    }
  }, [isMounted, systemUser, router]);

  // Sync lyrics index on timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setLyricIndex((prev) => (prev + 1) % lyricLines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!isMounted || systemUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-pulse text-zinc-500 font-medium text-lg italic">
          Initializing Audio...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary/30 overflow-y-auto relative font-sans no-scrollbar pb-12">
      {/* Dynamic Ambient Background Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] bg-emerald-400/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Glassmorphic Header Capsule */}
      <header className="fixed top-4 inset-x-4 z-40 max-w-5xl mx-auto rounded-2xl backdrop-blur-md bg-zinc-950/40 border border-white/5 px-6 py-3.5 flex items-center justify-between shadow-2xl">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <Radio className="w-5 h-5 text-black animate-pulse" />
          </div>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent italic">
            ONE MELODY
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <button 
            onClick={() => playerActions.openAuthModal()}
            className="relative group px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest overflow-hidden transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl group-hover:bg-white/10 group-hover:border-primary/30 transition-all duration-300" />
            <span className="relative text-white group-hover:text-primary transition-colors">Sign In</span>
          </button>
        </motion.div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-36 md:pt-44 pb-20 relative z-10 flex flex-col items-center">
        
        {/* Glowing Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 text-xs font-semibold text-primary uppercase tracking-widest shadow-inner shadow-white/5"
        >
          <Sparkles className="w-4 h-4 text-primary animate-spin-slow" />
          <span>The Next Generation Audio Platform</span>
        </motion.div>

        {/* Master Heading */}
        <div className="text-center max-w-4xl space-y-6 mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-8xl font-black tracking-tight leading-none bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent italic uppercase"
          >
            Your Music.<br />
            <span className="bg-gradient-to-r from-primary via-emerald-400 to-green-300 bg-clip-text text-transparent">
              Perfect Sync.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Experience premium high-fidelity audio streams synchronized seamlessly across all devices. Create your own playlists, search a global catalog, and listen in zero-buffer HLS quality.
          </motion.p>
        </div>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-24"
        >
          <button
            onClick={() => playerActions.openAuthModal()}
            className="w-full sm:w-auto px-8 py-4 bg-primary text-black rounded-2xl hover:bg-emerald-400 transition-all font-bold text-base shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
          >
            Start Listening
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all font-medium text-base text-center cursor-pointer hover:border-primary/30"
          >
            Explore Features
          </a>
        </motion.div>

        {/* Interactive Mockup Player */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          className="w-full max-w-5xl rounded-3xl border border-white/10 bg-zinc-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl relative group overflow-hidden hover:border-primary/20 transition-colors"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Spinning Album art & Synced lyrics preview */}
            <div className="md:col-span-4 flex flex-col items-center gap-4">
              <div 
                onClick={() => setIsPlaying(!isPlaying)}
                className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl group/album cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80 z-10 flex items-center justify-center opacity-0 group-hover/album:opacity-100 transition-opacity">
                  {isPlaying ? (
                    <Pause className="w-12 h-12 text-primary fill-primary animate-pulse" />
                  ) : (
                    <Play className="w-12 h-12 text-primary fill-primary" />
                  )}
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=600" 
                  className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? "scale-105" : ""}`} 
                  alt="Mock Music Album" 
                />
                <div className="absolute bottom-4 left-4 z-20">
                  <span className="px-2.5 py-1 rounded-md bg-primary text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-1.5 shadow-md">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75`}></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                    </span>
                    Live Stream
                  </span>
                </div>
              </div>

              {/* Bitrate Selector Interaction */}
              <div className="flex gap-2 bg-black/40 border border-white/5 rounded-full p-1 w-full max-w-[220px] justify-between shadow-inner">
                {(["standard", "high", "hifi"] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setMockQuality(q)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      mockQuality === q 
                        ? "bg-primary text-black shadow-md shadow-primary/20" 
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Song description and simulated equalizer */}
            <div className="md:col-span-8 space-y-6 text-left">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white italic uppercase flex items-center gap-2.5">
                    Sweater Weather
                    {isPlaying && <Music className="w-5 h-5 text-primary animate-bounce" />}
                  </h3>
                  <p className="text-primary font-medium mt-1">
                    The Neighbourhood • {mockQuality === "hifi" ? "HIFI FLAC Stream" : mockQuality === "high" ? "AAC Stream" : "MP3 Stream"}
                  </p>
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-zinc-400">
                  {mockQuality === "hifi" ? "320kbps" : mockQuality === "high" ? "192kbps" : "128kbps"}
                </div>
              </div>

              {/* Synced Lyrics Simulation Display */}
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 min-h-[60px] flex items-center justify-center text-center relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-2 left-3 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Real-time Lyrics</div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={lyricIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-base text-zinc-200 font-semibold italic px-4 mt-2"
                  >
                    {lyricLines[lyricIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Simulated Waveform */}
              <div className="space-y-2">
                <div className="flex items-end gap-1.5 h-16 w-full">
                  {[20, 45, 30, 80, 55, 60, 40, 95, 70, 85, 35, 50, 75, 90, 65, 45, 80, 100, 50, 60, 40, 85, 30, 70, 55, 90, 65, 45, 75, 30].map((val, idx) => (
                    <motion.div 
                      key={idx}
                      className="bg-primary/40 rounded-full flex-1"
                      animate={isPlaying ? { height: [`${val * 0.3}%`, `${val}%`, `${val * 0.5}%`, `${val * 0.3}%`] } : { height: `${val * 0.3}%` }}
                      transition={{ 
                        duration: 1.5 + (idx % 3) * 0.2, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: idx * 0.03
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <span>02:14</span>
                  <span>04:00</span>
                </div>
              </div>

              {/* Mock Controls */}
              <div className="flex items-center gap-6">
                <div 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Volume2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[65%] bg-gradient-to-r from-primary to-emerald-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </main>

      {/* Features Grid Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-32 relative z-10 border-t border-white/5">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-xs font-black uppercase tracking-widest text-primary">Superior Sound Architecture</h2>
          <p className="text-3xl md:text-5xl font-black tracking-tight italic uppercase">High Fidelity Streaming</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1: Adaptive HLS Streaming */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl shadow-xl hover:border-primary/40 transition-all duration-500 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-black transition-all duration-300">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-tight">Adaptive HLS Streaming</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Enjoy high-fidelity sound using HTTP Live Streaming (.m3u8). Stream segments are dynamically monitored and scaled in real-time, matching your network connection for zero-buffer streams.
            </p>
          </motion.div>

          {/* Card 2: Custom Playlists */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl shadow-xl hover:border-primary/40 transition-all duration-500 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-black transition-all duration-300">
              <ListMusic className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-tight">Personal Playlists</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Create, organize, and customize your own playlists. Easily add songs to any list, manage your active playback queue, and save your favourite tracks.
            </p>
          </motion.div>

          {/* Card 3: Real-Time Synced Lyrics */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl shadow-xl hover:border-primary/40 transition-all duration-500 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-black transition-all duration-300">
              <Disc className="w-6 h-6 animate-spin-slow" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-tight">Synced Interactive Lyrics</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Follow along perfectly with line-by-line synchronized lyrics scrolling automatically with the playing track, providing an immersive listening experience.
            </p>
          </motion.div>

          {/* Card 4: Secure Passwordless Auth */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl shadow-xl hover:border-primary/40 transition-all duration-500 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-black transition-all duration-300">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-tight">Secure HMAC OTP</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              No passwords required. Cryptographically secure logins via time-based, tamper-proof email HMAC OTP authentication codes with real-time countdown timers.
            </p>
          </motion.div>

          {/* Card 5: Equalizer & Quality */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl shadow-xl hover:border-primary/40 transition-all duration-500 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-black transition-all duration-300">
              <Volume2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-tight">HIFI Playback Controls</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Control your sonic environment. Adjust volume, choose quality stream profiles (128k/192k/320k), and watch the active frequency waveform visualizer update in real-time.
            </p>
          </motion.div>

          {/* Card 6: Smart Catalog Search */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl shadow-xl hover:border-primary/40 transition-all duration-500 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-black transition-all duration-300">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-tight">Global Catalog & Sync</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Quickly find your favorite tracks, artists, or albums with our fully indexed global search. Sync favorite songs and listening history seamlessly across devices.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-10 border-t border-white/5">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-xs font-black uppercase tracking-widest text-primary">Simplicity Redefined</h2>
          <p className="text-3xl md:text-5xl font-black tracking-tight italic uppercase">How OneMelody Works</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="flex flex-col items-center text-center space-y-4 group">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-2xl font-black text-primary shadow-xl shadow-primary/5 group-hover:border-primary/40 transition-colors">
              1
            </div>
            <h3 className="text-xl font-bold text-white uppercase">Passwordless Login</h3>
            <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
              Enter your email address and immediately receive a secure verification code. No password management needed.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 group">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-2xl font-black text-primary shadow-xl shadow-primary/5 group-hover:border-primary/40 transition-colors">
              2
            </div>
            <h3 className="text-xl font-bold text-white uppercase">Build Playlists</h3>
            <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
              Create your own custom playlists, browse global track lists, and select your favorite artists and songs.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 group">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-2xl font-black text-primary shadow-xl shadow-primary/5 group-hover:border-primary/40 transition-colors">
              3
            </div>
            <h3 className="text-xl font-bold text-white uppercase">Stream in HIFI</h3>
            <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
              Enjoy buffer-free HLS audio stream segments dynamically adapted to your network with real-time waveform visualizers.
            </p>
          </div>
        </div>
      </section>

      {/* Platform FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-6 py-20 relative z-10 border-t border-white/5">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-xs font-black uppercase tracking-widest text-primary">Frequently Asked Questions</h2>
          <p className="text-3xl font-black tracking-tight italic uppercase">Explore The Details</p>
        </div>

        <div className="space-y-2 bg-zinc-900/30 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
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

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 z-10 relative">
        <div className="p-12 md:p-20 rounded-3xl bg-gradient-to-r from-primary/10 to-emerald-950/20 border border-white/5 text-center space-y-8 relative overflow-hidden">
          <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[150%] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tight leading-none text-white relative z-10">
            Ready to hear the difference?
          </h2>
          <p className="text-zinc-300 text-lg max-w-xl mx-auto font-light relative z-10">
            Create an account in seconds with your email and access your personalized playlists and buffer-free audio frequencies anywhere.
          </p>
          <div className="flex justify-center relative z-10">
            <button
              onClick={() => playerActions.openAuthModal()}
              className="px-8 py-4 bg-primary text-black rounded-2xl hover:bg-emerald-400 transition-all font-extrabold text-base shadow-xl active:scale-95 flex items-center gap-2 group cursor-pointer"
            >
              Start Listening For Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-white/5 text-zinc-500 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-primary" />
          </div>
          <span>© 2026 One Melody. Built with passion and code.</span>
        </div>
        <div className="flex gap-8 text-xs font-semibold uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
          <a href="#" className="hover:text-white transition-colors">Discord</a>
        </div>
      </footer>
    </div>
  );
}

// Micro components
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 py-4 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-bold text-base md:text-lg text-white hover:text-primary transition-colors py-2 cursor-pointer"
      >
        <span>{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-primary shrink-0 ml-4" />
        ) : (
          <ChevronDown className="w-5 h-5 text-zinc-500 shrink-0 ml-4" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
