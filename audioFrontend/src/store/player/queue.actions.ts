import { playerStore } from "./index";
import { musicApi } from "@/lib/api";
import { mapListToPlayerSongs, type PlayerSong } from "@/lib/player-utils";

export const queueActions = {
  setQueue: (songs: PlayerSong[]) => {
    playerStore.setState((s) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("last_queue", JSON.stringify(songs));
      }
      return { ...s, queue: songs, lastQueueIndex: -1 };
    });
  },

  playAll: (songs: PlayerSong[], startPlaying = true) => {
    if (songs.length === 0) return;
    
    playerStore.setState((s) => {
      const currentIdx = s.lastQueueIndex;
      const newQueue = [...s.queue];
      newQueue.splice(currentIdx + 1, 0, ...songs);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("last_queue", JSON.stringify(newQueue));
      }
      
      return { ...s, queue: newQueue };
    });
    
    if (startPlaying) {
      import("@/store/player/playback.actions").then(({ playbackActions }) => {
        playbackActions.play(songs[0]);
      });
    }
  },

  refillQueue: async (isInit = false) => {
    const { queue, currentSong, systemUser, isRefilling, lastQueueIndex } = playerStore.state;
    if (isRefilling) return;
    if (!isInit && queue.length - lastQueueIndex > 3) return;

    try {
      playerStore.setState((s) => ({ ...s, isRefilling: true }));
      let res: any;
      if (systemUser?.id) {
        try {
          res = await musicApi.interactions.getRecommendations();
          // If recommendation is empty, fallback to trending
          const data = res?.data?.data || res?.data;
          if (!data || (Array.isArray(data) && data.length === 0)) {
            res = await musicApi.interactions.getTrending();
          }
        } catch (err) {
          res = await musicApi.interactions.getTrending();
        }
      } else {
        res = await musicApi.interactions.getTrending();
      }

      if (res?.success && res?.data) {
        const rawData = Array.isArray(res.data) ? res.data : (res.data.data || []);
        const newSongs = mapListToPlayerSongs(rawData);
        const existingIds = new Set(queue.map((s) => s.id));
        const uniqueNewSongs = newSongs.filter((s) => !existingIds.has(s.id));

        if (uniqueNewSongs.length > 0) {
          playerStore.setState((s) => {
            const updatedQueue = [...s.queue, ...uniqueNewSongs];
            if (typeof window !== "undefined") {
              localStorage.setItem("last_queue", JSON.stringify(updatedQueue));
            }
            return { ...s, queue: updatedQueue };
          });

          if (isInit && !currentSong && uniqueNewSongs.length > 0) {
            import("@/store/player/playback.actions").then(({ playbackActions }) => {
                playbackActions.play(uniqueNewSongs[0]);
                playbackActions.setIsPlaying(false);
            });
          }
        }
      }
    } catch (err) {
      console.error("[PlayerStore] Refill failed:", err);
    } finally {
      playerStore.setState((s) => ({ ...s, isRefilling: false }));
    }
  },

  initQueue: async () => {
    const { queue } = playerStore.state;
    if (queue.length === 0) {
      await queueActions.refillQueue(true);
    }
  },

  next: () => {
    const { queue, lastQueueIndex, isShuffle, repeatMode, currentSong } = playerStore.state;
    if (queue.length === 0) return;

    if (repeatMode === "one" && currentSong) {
      import("@/store/player/playback.actions").then(({ playbackActions }) => playbackActions.play(currentSong));
      return;
    }

    let nextIdx = lastQueueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    }

    if (nextIdx < queue.length) {
      import("@/store/player/playback.actions").then(({ playbackActions }) => playbackActions.play(queue[nextIdx]));
      const remaining = queue.length - (nextIdx + 1);
      if (remaining <= 2) {
        queueActions.refillQueue();
      }
    } else if (repeatMode === "all") {
      import("@/store/player/playback.actions").then(({ playbackActions }) => playbackActions.play(queue[0]));
    } else {
      import("@/store/player/playback.actions").then(({ playbackActions }) => playbackActions.setIsPlaying(false));
    }
  },

  previous: () => {
    const { queue, lastQueueIndex, currentTime } = playerStore.state;
    if (currentTime > 3) {
      import("@/store/player/playback.actions").then(({ playbackActions }) => playbackActions.setCurrentTime(0));
      return;
    }

    const prevIdx = lastQueueIndex - 1;
    if (prevIdx >= 0) {
      import("@/store/player/playback.actions").then(({ playbackActions }) => playbackActions.play(queue[prevIdx]));
    }
  },
};
