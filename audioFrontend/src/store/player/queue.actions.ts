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
      const existingIds = new Set(s.queue.map(sq => sq.id));
      const uniqueNewSongs = songs.filter(ns => !existingIds.has(ns.id));
      
      if (uniqueNewSongs.length === 0 && songs.length > 0) {
        console.log("[Queue] All songs in playAll are already in queue. Skipping append.");
        return s;
      }

      const newQueue = [...s.queue];
      newQueue.splice(currentIdx + 1, 0, ...uniqueNewSongs);
      
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
            res = await musicApi.interactions.getTrending(1, 2);
          }
        } catch (err) {
          res = await musicApi.interactions.getTrending(1, 2);
        }
      } else {
        res = await musicApi.interactions.getTrending(1, 2);
      }

      if (res?.success && res?.data) {
        const rawData = Array.isArray(res.data) ? res.data : (res.data.data || []);
        const newSongs = mapListToPlayerSongs(rawData);
        // Strictly filter against current queue to ensure uniqueness
        const existingIds = new Set(queue.map(s => s.id));
        const uniqueNewSongs = newSongs.filter(s => !existingIds.has(s.id));

        console.log(`[Queue] API returned ${newSongs.length} songs. Added all ${uniqueNewSongs.length} to queue. Total queue: ${queue.length + newSongs.length}`);

        if (uniqueNewSongs.length > 0) {
          playerStore.setState((s) => {
            let updatedQueue = [...s.queue, ...uniqueNewSongs];
            let updatedIdx = s.lastQueueIndex;

            // Prune history if it grows too large (keep only 20 previous songs)
            if (updatedIdx > 50) {
              const toRemove = updatedIdx - 20;
              updatedQueue = updatedQueue.slice(toRemove);
              updatedIdx = 20;
              console.log(`[Queue] Pruned ${toRemove} old songs from history.`);
            }

            console.log(`[Queue] APPENDED ${uniqueNewSongs.length} songs to the END of the queue. New total: ${updatedQueue.length}. Titles: ${uniqueNewSongs.map(s => s.title).join(', ')}`);
            if (typeof window !== "undefined") {
              localStorage.setItem("last_queue", JSON.stringify(updatedQueue));
            }
            return { ...s, queue: updatedQueue, lastQueueIndex: updatedIdx };
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

  clearQueue: () => {
    playerStore.setState((s) => {
      console.log("[Queue] Clearing queue and stopping playback...");
      if (typeof window !== "undefined") {
        localStorage.removeItem("last_queue");
        localStorage.removeItem("last_queue_index");
      }
      return { 
        ...s, 
        queue: [], 
        lastQueueIndex: -1, 
        currentSong: null, 
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        qualityTracks: []
      };
    });
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
      // Improved shuffle: Avoid immediately repeating the same song if the queue has other options
      const availableIndices = Array.from({ length: queue.length }, (_, i) => i)
        .filter(i => i !== lastQueueIndex);
      
      if (availableIndices.length > 0) {
        nextIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      } else {
        nextIdx = 0; // Fallback to start if only one song
      }
    }

    if (nextIdx < queue.length) {
      if (typeof window !== "undefined") {
        localStorage.setItem("last_queue_index", nextIdx.toString());
      }
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
      if (typeof window !== "undefined") {
        localStorage.setItem("last_queue_index", prevIdx.toString());
      }
      import("@/store/player/playback.actions").then(({ playbackActions }) => playbackActions.play(queue[prevIdx]));
    }
  },
};
