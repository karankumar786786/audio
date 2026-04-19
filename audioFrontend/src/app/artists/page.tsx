"use client";

import { useQuery } from "@tanstack/react-query";
import { musicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";
import Link from "next/link";
import { Mic2, Users2, Sparkles } from "lucide-react";

export default function ArtistsPage() {
  const { data: artistsResponse, isLoading } = useQuery({
    queryKey: ["artists"],
    queryFn: () => musicApi.artists.list(1, 100),
  });

  const artists = artistsResponse?.data?.data || [];

  return (
    <div className="px-10 pb-20">
      <header className="relative h-[300px] rounded-[3rem] overflow-hidden mb-12 shadow-2xl flex items-end">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-950 via-zinc-950 to-black">
          <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent z-10" />
        </div>

        <div className="relative z-20 p-12 flex items-center gap-10">
          <div className="w-48 h-48 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 border border-white/10 flex items-center justify-center">
            <Mic2 className="text-white" size={64} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 italic">
                Vocal Nodes
              </span>
              <div className="h-1 w-8 bg-indigo-500 rounded-full" />
            </div>
            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
              Artists
            </h1>
            <p className="text-zinc-500 text-sm font-medium opacity-80 max-w-xl">
              Curated list of verified acoustic sources within the synchronized
              network.
            </p>
          </div>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
              Verified Frequencies
            </h2>
            <div className="h-px w-24 bg-linear-to-r from-indigo-500 to-transparent" />
          </div>
          <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">
            <Users2 size={14} />
            <span>{artists.length} Sources Detected</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square bg-zinc-900/40 border border-white/5 rounded-[3rem] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
            {artists.map((artist: any) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="group relative"
              >
                <div className="aspect-square bg-zinc-900 rounded-[3rem] border border-white/5 overflow-hidden mb-4 group-hover:border-indigo-500/50 transition-all duration-500 group-hover:scale-[1.02] shadow-xl group-hover:shadow-indigo-500/10">
                  <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-950 flex items-center justify-center group-hover:from-indigo-900 group-hover:to-zinc-950 transition-colors duration-700">
                    {artist.coverImageKey ? (
                      <img 
                        src={getImageUrl(artist.coverImageKey, { 
                          width: 400, 
                          height: 400, 
                          focus: "face",
                          aspectRatio: "1-1" 
                        })} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        alt={artist.name}
                      />
                    ) : (
                      <Mic2
                        className="text-zinc-800 group-hover:text-indigo-400/30 transition-colors"
                        size={80}
                      />
                    )}
                  </div>

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl scale-90 group-hover:scale-100 transition-transform">
                      <Sparkles size={20} />
                    </div>
                  </div>
                </div>
                <h3 className="text-center font-black italic uppercase tracking-tighter text-zinc-400 group-hover:text-white transition-colors">
                  {artist.name}
                </h3>
                <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-1 italic">
                  Verified Node
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
