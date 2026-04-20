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
      const lastSong = localStorage.getItem("last_played_song");
      const lastQueue = localStorage.getItem("last_queue");
      
      playerStore.setState((s) => {
        const song = lastSong ? JSON.parse(lastSong) : s.currentSong;
        const queueRes = lastQueue ? JSON.parse(lastQueue) : s.queue;
        const idx = queueRes.findIndex((item: any) => item.id === (song?.id));

        return {
          ...s,
          currentSong: song,
          queue: queueRes,
          lastQueueIndex: idx !== -1 ? idx : s.lastQueueIndex,
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
