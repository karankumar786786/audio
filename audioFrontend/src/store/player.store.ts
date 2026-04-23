import { playerStore } from "./player/index";
import { queueActions } from "./player/queue.actions";
import { playbackActions } from "./player/playback.actions";
import { sessionActions } from "./player/session.actions";

export { playerStore };

export const playerActions = {
  ...queueActions,
  ...playbackActions,
  ...sessionActions,
  
  // High-level combined actions if any
  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const lastIdxStr = localStorage.getItem("last_queue_index");
      const lastQueueStr = localStorage.getItem("last_queue");
      
      playerStore.setState((s) => {
        const queueRes = lastQueueStr ? JSON.parse(lastQueueStr) : s.queue;
        const savedIdx = lastIdxStr ? parseInt(lastIdxStr, 10) : -1;
        
        let currentSong = s.currentSong;
        let lastQueueIndex = s.lastQueueIndex;

        if (queueRes.length > 0 && savedIdx >= 0 && savedIdx < queueRes.length) {
          currentSong = queueRes[savedIdx];
          lastQueueIndex = savedIdx;
        }

        return {
          ...s,
          currentSong,
          queue: queueRes,
          lastQueueIndex,
        };
      });
    } catch (err) {
      console.error("[PlayerStore] Hydration failed:", err);
    }
  },

  // Alias for backward compatibility
  playSong: (song: any) => playbackActions.play(song),
  playFromQueue: (index: number) => {
    const { queue } = playerStore.state;
    if (index >= 0 && index < queue.length) {
      playbackActions.play(queue[index]);
    }
  },
};
