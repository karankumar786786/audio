import { playerStore } from "./index";
import { musicApi } from "@/lib/api";
import { mapListToPlayerSongs, type PlayerSong } from "@/lib/player-utils";

export const queueActions = {
  setQueue: (songs: PlayerSong[]) => {
    playerStore.setState((s) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("last_queue", JSON.stringify(songs));
      }
      console.log(`[Queue] Setting queue: ${songs.length} songs`);
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
      
      console.log(`[Queue] Added ${songs.length} songs to queue after current. New total: ${newQueue.length}`);
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
        
        const freshSongs = newSongs.filter((s) => !existingIds.has(s.id));
        const repetitiveSongs = newSongs.filter((s) => existingIds.has(s.id));

        // Allow up to 50% of the batch to be duplicates
        const maxDuplicates = Math.floor(newSongs.length / 2);
        const duplicatesToTake = repetitiveSongs.slice(0, maxDuplicates);
        const songsToAdd = [...freshSongs, ...duplicatesToTake];

        if (songsToAdd.length > 0) {
          playerStore.setState((s) => {
            const updatedQueue = [...s.queue, ...songsToAdd];
            console.log(`[Queue] Refilled with ${songsToAdd.length} songs (${freshSongs.length} fresh, ${duplicatesToTake.length} repetitive). New total: ${updatedQueue.length}`);
            if (typeof window !== "undefined") {
              localStorage.setItem("last_queue", JSON.stringify(updatedQueue));
            }
            return { ...s, queue: updatedQueue };
          });
          
          // Cleanup old history if queue is too large
          queueActions.trimQueue();

          if (isInit && !currentSong && songsToAdd.length > 0) {
            import("@/store/player/playback.actions").then(({ playbackActions }) => {
                playbackActions.play(songsToAdd[0]);
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

  trimQueue: () => {
    playerStore.setState((s) => {
      // Keep queue manageable (max 100). Keep 20 songs of history.
      if (s.queue.length <= 100) return s;

      const keepBefore = 20;
      const startIdx = Math.max(0, s.lastQueueIndex - keepBefore);

      if (startIdx <= 0) return s;

      const newQueue = s.queue.slice(startIdx);
      const newLastQueueIndex = s.lastQueueIndex - startIdx;

      console.log(`[Queue] Trimmed ${startIdx} historical songs. New total: ${newQueue.length}`);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("last_queue", JSON.stringify(newQueue));
      }

      return { ...s, queue: newQueue, lastQueueIndex: newLastQueueIndex };
    });
  },
};
