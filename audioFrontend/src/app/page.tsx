"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { playerStore, playerActions } from "@/store/player.store";
import { useStore } from "@tanstack/react-store";
import { motion } from "framer-motion";
import { Sparkles, Music, Zap, Flame, Shield, ArrowRight, Disc, Play, Radio, Volume2 } from "lucide-react";

export default function Home() {
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && systemUser) {
      router.push("/home");
    }
  }, [isMounted, systemUser, router]);

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
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30 overflow-y-auto relative font-sans no-scrollbar">
      {/* Dynamic Ambient Background Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Glassmorphic Header */}
      <header className="fixed top-0 inset-x-0 z-40 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto backdrop-blur-md bg-zinc-950/20 border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Radio className="w-5 h-5 text-white animate-pulse" />
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
            className="relative group px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest overflow-hidden transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300" />
            <span className="relative text-white group-hover:text-white transition-colors">Sign In</span>
          </button>
        </motion.div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-32 md:pt-40 pb-20 relative z-10 flex flex-col items-center">
        
        {/* Glowing Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 text-xs font-semibold text-indigo-300 uppercase tracking-widest shadow-inner shadow-white/5"
        >
          <Sparkles className="w-4.5 h-4.5 text-indigo-400 animate-spin-slow" />
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
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Perfect Sync.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light"
          >
            Experience high-fidelity audio streams synchronized seamlessly across all devices. No delay, no setup, just pure sonic pleasure.
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
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl hover:from-indigo-500 hover:to-violet-500 transition-all font-bold text-base shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
          >
            Start Listening
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all font-medium text-base text-center cursor-pointer"
          >
            Explore Features
          </a>
        </motion.div>

        {/* Interactive Mockup Player */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          className="w-full max-w-5xl rounded-3xl border border-white/10 bg-zinc-900/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-emerald-500/5 pointer-events-none" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Spinning Album art */}
            <div className="md:col-span-4 flex justify-center">
              <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl group/album cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80 z-10 flex items-center justify-center opacity-0 group-hover/album:opacity-100 transition-opacity">
                  <Play className="w-12 h-12 text-indigo-400 fill-indigo-400 animate-pulse" />
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=600" 
                  className="w-full h-full object-cover group-hover/album:scale-105 transition-transform duration-700" 
                  alt="Mock Music Album" 
                />
                <div className="absolute bottom-4 left-4 z-20">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-600/90 text-[10px] font-black uppercase tracking-widest text-white">Live Stream</span>
                </div>
              </div>
            </div>

            {/* Song description and simulated equalizer */}
            <div className="md:col-span-8 space-y-6 text-left">
              <div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white italic uppercase">Sweater Weather</h3>
                <p className="text-indigo-400 font-medium mt-1">The Neighbourhood • HLS Stream</p>
              </div>

              {/* Simulated Waveform */}
              <div className="space-y-2">
                <div className="flex items-end gap-1.5 h-16 w-full">
                  {[20, 45, 30, 80, 55, 60, 40, 95, 70, 85, 35, 50, 75, 90, 65, 45, 80, 100, 50, 60, 40, 85, 30, 70, 55, 90, 65, 45, 75, 30].map((val, idx) => (
                    <motion.div 
                      key={idx}
                      className="bg-indigo-500/40 rounded-full flex-1"
                      animate={{ height: [`${val * 0.3}%`, `${val}%`, `${val * 0.5}%`, `${val * 0.3}%`] }}
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
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-[55%] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </main>

      {/* Features Grid Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-32 relative z-10 border-t border-white/5">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400">Superior Sound Architecture</h2>
          <p className="text-3xl md:text-5xl font-black tracking-tight italic uppercase">High Fidelity Streaming</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl shadow-xl hover:border-indigo-500/40 transition-all duration-500 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
              <Disc className="w-6 h-6 animate-spin-slow" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-tight">Adaptive HLS Playback</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Our advanced Hls.js architecture adjusts audio streaming dynamically based on network bandwidth for crystal-clear, lag-free playback.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl shadow-xl hover:border-violet-500/40 transition-all duration-500 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-tight">AI Recommendation Engine</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Integration with Recombee provides instant personalization. Discover songs, artists, and curated mixes customized exactly to your tastes.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl shadow-xl hover:border-emerald-500/40 transition-all duration-500 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-tight">Global Search & Sync</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Search the Algolia-powered global music catalogue. Sync your favourites and listen history securely with custom email-based HMAC tokens.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 z-10 relative">
        <div className="p-12 md:p-20 rounded-3xl bg-gradient-to-r from-indigo-900/30 to-violet-900/30 border border-white/5 text-center space-y-8 relative overflow-hidden">
          <div className="absolute -top-[50%] -left-[20%] w-[80%] h-[150%] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tight leading-none text-white relative z-10">
            Ready to hear the difference?
          </h2>
          <p className="text-zinc-300 text-lg max-w-xl mx-auto font-light relative z-10">
            Create an account in seconds with your email and access your personalized frequencies anywhere, anytime.
          </p>
          <div className="flex justify-center relative z-10">
            <button
              onClick={() => playerActions.openAuthModal()}
              className="px-8 py-4 bg-white text-zinc-950 rounded-2xl hover:bg-zinc-200 transition-all font-extrabold text-base shadow-xl active:scale-95 flex items-center gap-2 group cursor-pointer"
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
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
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
