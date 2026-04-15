"use client";

import { useAuth0 } from "@auth0/auth0-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-pulse text-zinc-500 font-medium text-lg italic">Initializing Audio...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          </div>
          <span className="text-xl font-bold tracking-tight">AudioSync</span>
        </div>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-zinc-500">{user?.email}</span>
              </div>
              <button 
                onClick={() => logout({ logoutParams: { returnTo: typeof window !== "undefined" ? window.location.origin : "" } })}
                className="px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all text-sm font-medium"
              >
                Log out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => loginWithRedirect()}
              className="px-6 py-2.5 bg-white text-black rounded-full hover:bg-zinc-200 transition-all text-sm font-bold shadow-lg active:scale-95"
            >
              Log in
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-1000">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">
            YOUR MUSIC.<br/>EVERYWHERE.
          </h1>
          
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light">
            Experience the next generation of audio streaming. 
            Connect your world with seamless synchronization across all your devices.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <button 
                onClick={() => router.push("/home")}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all font-bold text-lg shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 group"
              >
                Enter Library
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            ) : (
              <button 
                onClick={() => loginWithRedirect()}
                className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-950 rounded-2xl hover:bg-zinc-200 transition-all font-extrabold text-lg shadow-xl active:scale-95 flex items-center justify-center gap-2 group"
              >
                Start Listening
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="m5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            )}
            
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all font-medium text-lg">
              Learn more
            </button>
          </div>
        </div>

        {/* Floating elements for aesthetics */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
           {/* Mock logos or icons could go here */}
        </div>
      </main>

      <footer className="px-8 py-10 border-t border-white/5 text-zinc-500 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-sm">© 2026 AudioSync Inc. Built with passion.</div>
        <div className="flex gap-8 text-xs font-medium uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
          <a href="#" className="hover:text-white transition-colors">Discord</a>
        </div>
      </footer>
    </div>
  );
}

