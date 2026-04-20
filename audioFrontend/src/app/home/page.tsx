"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { musicApi, type Song, type Artist, type Playlist } from "../../lib/api";
import { SongCard } from "../../components/SongCard";
import { HeroSection } from "../../components/HeroSection";
import { ArtistCard } from "../../components/ArtistCard";
import { PlaylistCard } from "../../components/PlaylistCard";
import { useEffect, useState } from "react";
import {  Clock, Users2, ListMusic, Zap } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import { playerStore } from "../../store/player.store";

export default function HomePage() {
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const [heroIndex, setHeroIndex] = useState(0);

  // Trending Songs (Featured)
  const { data: trending, isLoading: isTrendingLoading } = useQuery({
    queryKey: ["trending-songs"],
    queryFn: () => musicApi.interactions.getTrending(),
  });

  // Top Artists
  const { data: artists, isLoading: isArtistsLoading } = useQuery({
    queryKey: ["home-artists"],
    queryFn: () => musicApi.artists.list(1, 15),
  });

  // Featured Playlists
  const { data: playlists, isLoading: isPlaylistsLoading } = useQuery({
    queryKey: ["home-playlists"],
    queryFn: () => musicApi.playlists.list(1, 15),
  });

  // Discover Feed (Infinite Scroll)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["discover-songs"],
      queryFn: ({ pageParam }) =>
        musicApi.songs.getFeed(pageParam as number, 15),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.data.pagination.hasNext
          ? lastPage.data.pagination.page + 1
          : undefined,
    });

  const systemToken = useStore(playerStore, (s) => s.systemToken);

  // Recommendations
  const { data: recommendations } = useQuery({
    queryKey: ["recommendations", systemUser?.id],
    queryFn: () => musicApi.interactions.getRecommendations(),
    enabled: !!systemUser?.id && !!systemToken,
  });

  // Auto-switch hero if trending data exists
  useEffect(() => {
    if (!trending?.data?.data || trending.data.data.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(trending.data.data.length, 5));
    }, 8000);
    return () => clearInterval(interval);
  }, [trending?.data?.data]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    const target = document.getElementById("infinite-scroll-trigger");
    if (target) observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="px-10 pb-20 space-y-20">
      
      {/* 1. Hero Section (Featured/Trending) */}
      <HeroSection 
        songs={trending?.data?.data?.slice(0, 5) || []}
        index={heroIndex}
        setIndex={setHeroIndex}
        isLoading={isTrendingLoading}
      />

      {/* 2. Top Artists Section */}
      <section>
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Users2 className="text-primary" size={18} />
            </div>
            <h2 className="text-2xl font-black italic tracking-tight uppercase text-white">
              Top Artists
            </h2>
          </div>
          <div className="h-px flex-1 mx-8 bg-linear-to-r from-white/6 to-transparent" />
        </div>

        <div className="flex flex-row overflow-x-auto gap-12 pb-6 no-scrollbar mask-fade-right px-1">
          {isArtistsLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex-none w-[160px] space-y-4">
                <div className="aspect-square rounded-full bg-zinc-900 animate-pulse border border-white/3" />
                <div className="h-3 w-3/4 bg-zinc-900 rounded mx-auto animate-pulse" />
              </div>
            ))
          ) : (
            artists?.data?.data?.map((artist: Artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))
          )}
        </div>
      </section>

      {/* 3. Featured Playlists Section */}
      <section>
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <ListMusic className="text-primary" size={18} />
            </div>
            <h2 className="text-2xl font-black italic tracking-tight uppercase text-white">
              Featured Playlists
            </h2>
          </div>
          <div className="h-px flex-1 mx-8 bg-linear-to-r from-white/6 to-transparent" />
        </div>

        <div className="flex flex-row overflow-x-auto gap-8 pb-6 no-scrollbar mask-fade-right px-1">
          {isPlaylistsLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex-none w-[180px] space-y-4">
                <div className="aspect-square rounded-[2.5rem] bg-zinc-900 animate-pulse border border-white/3" />
                <div className="h-3 w-1/2 bg-zinc-900 rounded animate-pulse" />
              </div>
            ))
          ) : (
            playlists?.data?.data?.map((playlist: Playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))
          )}
        </div>
      </section>

      {/* 4. Recommendations (Conditional) */}
      {systemUser &&
        recommendations?.data?.data &&
        recommendations.data.data.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-8 px-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                  <Zap className="text-primary fill-primary" size={18} />
                </div>
                <h2 className="text-2xl font-black italic tracking-tight uppercase text-white">
                  Recommendations
                </h2>
              </div>
              <div className="h-px flex-1 bg-linear-to-r from-white/6 to-transparent" />
            </div>

            <div className="flex flex-row overflow-x-auto gap-6 pb-6 no-scrollbar mask-fade-right px-1">
              {recommendations.data.data.slice(0, 10).map((song: Song) => (
                <SongCard 
                  key={`rec-${song.id}`} 
                  song={song} 
                  className="flex-none w-[220px]"
                />
              ))}
            </div>
          </section>
        )}

      {/* 5. Discovery Feed */}
      <section>
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-800/60 rounded-xl border border-white/4">
                <Clock className="text-zinc-400" size={18} />
              </div>
              <h2 className="text-2xl font-black italic tracking-tight uppercase text-white">
                All Tracks
              </h2>
            </div>
            <div className="h-px w-16 bg-linear-to-r from-white/6 to-transparent" />
          </div>
        </div>

        {status === "pending" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="aspect-square bg-zinc-900/30 border border-white/3 rounded-4xl animate-pulse"
              />
            ))}
          </div>
        ) : status === "error" ? (
          <div className="p-20 text-center text-zinc-600 border border-dashed border-zinc-800 rounded-4xl font-bold italic tracking-tight uppercase">
            Failed to load tracks
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {data?.pages.map((page, i) =>
              page.data.data.map((song: Song, songIdx: number) => (
                  <SongCard
                    key={`${song.id}-${i}-${songIdx}`}
                    song={song}
                    priority={i === 0 && songIdx < 6}
                  />
                )),
            )}
          </div>
        )}

        {/* Loader/Trigger */}
        <div
          id="infinite-scroll-trigger"
          className="h-32 flex items-center justify-center mt-12"
        >
          {isFetchingNextPage && (
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 border-[3px] border-primary/10 rounded-full" />
              <div className="absolute inset-0 border-[3px] border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
