"use client";

import { useQuery } from "@tanstack/react-query";
import { musicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";
import Link from "next/link";
import {  ChevronRight } from "lucide-react";

export default function ArtistsPage() {
  const { data: artistsResponse, isLoading } = useQuery({
    queryKey: ["artists"],
    queryFn: () => musicApi.artists.list(1, 100),
  });

  const artists = artistsResponse?.data?.data || [];

  return (
    <div className="px-10 pb-20">
      <section>
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
              Artists
            </h2>
            <div className="h-px w-24 bg-linear-to-r from-primary to-transparent" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-24 bg-zinc-900/40 border border-white/5 rounded-3xl animate-pulse"
              />
            ))
          ) : artists.length > 0 ? (
            artists.map((artist: any) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="group flex items-center gap-8 p-6 rounded-4xl border-2 border-white/3 hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] transition-all duration-500"
              >
                {/* Artist Avatar */}
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-2 ring-white/5 group-hover:ring-primary/40 transition-all duration-700 shadow-2xl">
                  {artist.coverImageKey ? (
                    <img
                      src={getImageUrl(artist.coverImageKey, {
                        width: 200,
                        height: 200,
                        focus: "face",
                        aspectRatio: "1-1",
                      })}
                      alt={artist.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-black italic uppercase">
                      {artist.name?.[0]}
                    </div>
                  )}
                </div>

                {/* Info Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors">
                      {artist.name}
                    </h3>
                  </div>
                  <p className="text-zinc-500 text-xs font-medium line-clamp-1 max-w-3xl italic opacity-60 group-hover:opacity-100 transition-opacity">
                    {artist.about || "A verified acoustic node within the synchronization matrix."}
                  </p>
                </div>

                {/* Action Icon */}
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 p-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-black flex items-center justify-center shadow-2xl shadow-primary/20 scale-90 group-hover:scale-100 transition-transform">
                    <ChevronRight size={24} strokeWidth={3} />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-32 text-center text-zinc-700 border-2 border-dashed border-zinc-900 rounded-[4rem] font-bold italic tracking-tight uppercase">
              No Artists founfd
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
