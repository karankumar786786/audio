"use client";

import { useAuth0 } from "@auth0/auth0-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-pulse text-zinc-500 font-medium text-lg italic">Loading your library...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans">
      {/* Sidebar - Desktop */}
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col hidden md:flex">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              </div>
              <span className="text-lg font-bold">AudioSync</span>
            </div>

            <nav className="space-y-1">
              {['Home', 'Search', 'Library'].map((item) => (
                <button 
                    key={item} 
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${item === 'Home' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                >
                  <div className="w-5 h-5" />
                  {item}
                </button>
              ))}
            </nav>

            <div className="mt-10">
              <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Playlists</h3>
              <div className="space-y-1">
                 <button className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors truncate">Recently Played</button>
                 <button className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors truncate">Favorites</button>
                 <button className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors truncate">Deep Focus</button>
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-white/5">
             <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                <Image 
                    src={user?.picture || "https://avatar.vercel.sh/user"} 
                    alt="Profile" 
                    width={32} 
                    height={32} 
                    className="rounded-full"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <button 
                        onClick={() => logout({ logoutParams: { returnTo: typeof window !== "undefined" ? window.location.origin : "" } })}
                        className="text-[10px] text-zinc-500 hover:text-indigo-400 uppercase tracking-wider font-bold transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
             </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-indigo-900/20 to-black">
          <header className="sticky top-0 z-10 px-8 py-6 flex items-center justify-between backdrop-blur-md bg-black/20">
             <div className="flex items-center gap-4">
                <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" transform="rotate(180 12 12)"/></svg>
                </button>
             </div>
             
             <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:scale-105 transition-transform active:scale-95">
                    Upgrade to Pro
                </button>
             </div>
          </header>

          <div className="px-8 py-4 space-y-12 pb-32">
            <section>
              <h1 className="text-3xl font-black mb-6">Good evening, {user?.given_name || user?.name?.split(' ')[0]}</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-all rounded-md overflow-hidden cursor-pointer relative pr-4">
                    <div className="w-20 h-20 bg-zinc-800 flex-shrink-0 animate-pulse" />
                    <span className="font-bold truncate text-sm">Recently Played Album {i}</span>
                    <button className="absolute right-4 w-12 h-12 bg-indigo-500 rounded-full shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all flex items-center justify-center text-black">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 12 8-12 8V4z"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Recommended for you</h2>
                    <button className="text-sm font-bold text-zinc-500 hover:underline">Show all</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-zinc-900/40 hover:bg-zinc-900 transition-all p-4 rounded-xl group cursor-pointer">
                            <div className="aspect-square bg-zinc-800 rounded-lg mb-4 relative shadow-2xl">
                                <button className="absolute bottom-2 right-2 w-10 h-10 bg-indigo-500 rounded-full shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all flex items-center justify-center text-black">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 12 8-12 8V4z"/></svg>
                                </button>
                            </div>
                            <h3 className="font-bold text-sm mb-1 truncate">Daily Mix {i}</h3>
                            <p className="text-xs text-zinc-500 line-clamp-2">A curated selection of the tracks you love most.</p>
                        </div>
                    ))}
                </div>
            </section>
          </div>
        </main>
      </div>

      {/* Player - Static for UI */}
      <footer className="fixed bottom-0 left-0 right-0 h-24 bg-black border-t border-white/5 px-4 flex items-center justify-between z-20">
         <div className="flex items-center gap-4 w-1/3">
            <div className="w-14 h-14 bg-zinc-800 rounded-md" />
            <div>
                <p className="text-sm font-bold hover:underline cursor-pointer">Echoes in the Dark</p>
                <p className="text-xs text-zinc-500 hover:text-white cursor-pointer transition-colors">Digital Mirage</p>
            </div>
         </div>

         <div className="flex flex-col items-center gap-2 w-1/3">
            <div className="flex items-center gap-6">
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m19 20-4-4m0-4 4-4m-4 4H3"/></svg>
                </button>
                <button className="text-zinc-500 hover:text-white transition-colors rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m11 19-7-7 7-7"/><path d="M11 12H19"/></svg>
                </button>
                <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 12 8-12 8V4z"/></svg>
                </button>
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m13 5 7 7-7 7"/><path d="M13 12H5"/></svg>
                </button>
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                </button>
            </div>
            <div className="flex items-center gap-2 w-full max-w-md">
                <span className="text-[10px] text-zinc-500">1:45</span>
                <div className="flex-1 h-1 bg-zinc-800 rounded-full relative group cursor-pointer">
                    <div className="absolute top-0 left-0 h-full w-1/3 bg-white group-hover:bg-indigo-500 rounded-full" />
                </div>
                <span className="text-[10px] text-zinc-500">3:52</span>
            </div>
         </div>

         <div className="flex items-center justify-end gap-4 w-1/3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <div className="w-24 h-1 bg-zinc-800 rounded-full">
                <div className="h-full w-2/3 bg-white hover:bg-indigo-500 rounded-full" />
            </div>
         </div>
      </footer>
    </div>
  );
}
