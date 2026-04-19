"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { musicApi, type Song } from "../../lib/api";
import { SongCard } from "../../components/SongCard";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Clock, Compass, Zap } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import { playerStore } from "../../store/player.store";

export default function HomePage() {
  const systemUser = useStore(playerStore, (s) => s.systemUser);

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

  // Trending Songs
  const { data: trending, isLoading: isTrendingLoading } = useQuery({
    queryKey: ["trending-songs"],
    queryFn: () => musicApi.interactions.getTrending(),
  });

  const systemToken = useStore(playerStore, (s) => s.systemToken);

  // Recommendations
  const { data: recommendations, isLoading: isRecLoading } = useQuery({
    queryKey: ["recommendations", systemUser?.id],
    queryFn: () => musicApi.interactions.getRecommendations(),
    enabled: !!systemUser?.id && !!systemToken,
  });

  const trendingRef = useRef<HTMLDivElement>(null);

  const scrollToTrending = () => {
    trendingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
    <div className="px-10 pb-20">

      {/* Trending Section */}
      <section ref={trendingRef} className="mb-16">
        <div className="flex items-center gap-4 mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <TrendingUp className="text-indigo-400" size={18} />
            </div>
            <h2 className="text-2xl font-black italic tracking-tight uppercase text-white">
              Trending
            </h2>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {isTrendingLoading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-square bg-zinc-900/30 rounded-[2rem] animate-pulse border border-white/[0.03]"
              />
            ))
          ) : trending?.data?.data && trending.data.data.length > 0 ? (
            trending.data.data
              .slice(0, 5)
              .map((song: Song) => (
                <SongCard key={`trend-${song.id}`} song={song} />
              ))
          ) : (
            <div className="col-span-full py-10 text-center text-zinc-700 font-bold italic tracking-tight uppercase border border-dashed border-zinc-900 rounded-[2rem]">
              No trending data yet
            </div>
          )}
        </div>
      </section>

      {/* Recommended Section (Conditional) */}
      {systemUser &&
        recommendations?.data?.data &&
        recommendations.data.data.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8 px-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <Zap className="text-purple-400 fill-purple-400" size={18} />
                </div>
                <h2 className="text-2xl font-black italic tracking-tight uppercase text-white">
                  For You
                </h2>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {recommendations.data.data.slice(0, 5).map((song: Song) => (
                <SongCard key={`rec-${song.id}`} song={song} />
              ))}
            </div>
          </section>
        )}

      {/* Discovery Feed */}
      <section>
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-800/60 rounded-xl border border-white/[0.04]">
                <Clock className="text-zinc-400" size={18} />
              </div>
              <h2 className="text-2xl font-black italic tracking-tight uppercase text-white">
                All Tracks
              </h2>
            </div>
            <div className="h-px w-16 bg-gradient-to-r from-white/[0.06] to-transparent" />
          </div>
        </div>

        {status === "pending" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="aspect-square bg-zinc-900/30 border border-white/[0.03] rounded-[2rem] animate-pulse"
              />
            ))}
          </div>
        ) : status === "error" ? (
          <div className="p-20 text-center text-zinc-600 border border-dashed border-zinc-800 rounded-[2rem] font-bold italic tracking-tight uppercase">
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
              <div className="absolute inset-0 border-[3px] border-indigo-500/10 rounded-full" />
              <div className="absolute inset-0 border-[3px] border-t-indigo-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
