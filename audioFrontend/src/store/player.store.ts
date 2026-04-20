import { Store } from "@tanstack/react-store";
import { type PlayerSong } from "../lib/player-utils";
import { musicApi } from "../lib/api";
import { mapListToPlayerSongs } from "../lib/player-utils";

interface PlayerState {
  currentSong: PlayerSong | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: PlayerSong[];
  lastQueueIndex: number;
  repeatMode: "none" | "one" | "all";
  isShuffle: boolean;
  // Shaka/Lyrics specific
  qualityTracks: any[];
  selectedQuality: "auto" | number;
  isLyricsOpen: boolean;
  // System Auth
  systemToken: string | null;
  systemUser: any | null;
  favourites: Set<string>;
}

// Restore systemUser from localStorage on init
// Only accept users with valid signed IDs (format: uuid.hmac-signature)
const _initSystemUser = (() => {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("system_user");
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    // Validate: signed IDs must contain exactly one dot separating uuid from signature
    if (parsed && parsed.id && typeof parsed.id === "string") {
      const parts = parsed.id.split(".");
      if (parts.length === 2 && parts[0] && parts[1]) {
        return parsed;
      }
    }
    // Clear stale/invalid data to prevent 400 errors
    console.warn(
      "[PlayerStore] Clearing stale system_user (unsigned ID detected).",
    );
    localStorage.removeItem("system_user");
    localStorage.removeItem("system_token");
    return null;
  } catch {
    return null;
  }
})();

export const playerStore = new Store<PlayerState>({
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  queue: [],
  lastQueueIndex: -1,
  repeatMode: "none",
  isShuffle: false,
  qualityTracks: [],
  selectedQuality: "auto",
  isLyricsOpen: false,
  systemToken: null,
  systemUser: _initSystemUser,
  favourites: new Set<string>(),
});

// Hydrate token on client side only
if (typeof window !== "undefined") {
  const token = localStorage.getItem("system_token");
  if (token) {
    playerStore.setState((s) => ({ ...s, systemToken: token }));
  }
}

export const playerActions = {
  setSystemSession: (token: string, user: any) => {
    localStorage.setItem("system_token", token);
    localStorage.setItem("system_user", JSON.stringify(user));
    playerStore.setState((s) => ({
      ...s,
      systemToken: token,
      systemUser: user,
    }));
  },

  clearSystemSession: () => {
    localStorage.removeItem("system_token");
    localStorage.removeItem("system_user");
    playerStore.setState((s) => ({
      ...s,
      systemToken: null,
      systemUser: null,
      favourites: new Set(),
    }));
  },

  play: (song: PlayerSong) => {
    playerStore.setState((s) => {
      const idx = s.queue.findIndex((item) => item.id === song.id);
      const newState = {
        ...s,
        currentSong: song,
        isPlaying: true,
        lastQueueIndex: idx !== -1 ? idx : s.lastQueueIndex,
        currentTime: 0,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("last_played_song", JSON.stringify(song));
      }
      return newState;
    });
  },

  playSong: (song: PlayerSong) => playerActions.play(song),

  playFromQueue: (index: number) => {
    const { queue } = playerStore.state;
    if (index >= 0 && index < queue.length) {
      playerActions.play(queue[index]);
    }
  },

  setQueue: (songs: PlayerSong[]) => {
    playerStore.setState((s) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("last_queue", JSON.stringify(songs));
      }
      return { ...s, queue: songs, lastQueueIndex: -1 };
    });
  },

  // Intelligent Play All: Insert after current index instead of replacing
  playAll: (songs: PlayerSong[]) => {
    if (songs.length === 0) return;
    
    playerStore.setState((s) => {
      const currentIdx = s.lastQueueIndex;
      const newQueue = [...s.queue];
      
      // Insert after current index
      newQueue.splice(currentIdx + 1, 0, ...songs);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("last_queue", JSON.stringify(newQueue));
      }
      
      return {
        ...s,
        queue: newQueue,
        // We don't automatically jump if something is already playing,
        // but often 'Play All' implies start playing the first one.
        // I'll stick to the "Add to queue after current" request literal interpretation.
        // Actually, users usually expect the first song to start if they click Play All.
        // I'll start the first one but it's now at currentIdx + 1.
      };
    });
    
    // Auto-start the first song of the new batch
    const { queue, lastQueueIndex } = playerStore.state;
    playerActions.play(songs[0]);
  },

  // Hydrate from localStorage
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

  // Initialize with recommendations if empty (auth-aware fallback)
  initQueue: async () => {
    const { queue, currentSong, systemUser } = playerStore.state;
    if (queue.length === 0) {
      try {
        console.log("[PlayerStore] 🤖 Initializing queue...");

        let res;
        // If logged in, get personalized recommendations
        if (systemUser?.id) {
          try {
            res = await musicApi.interactions.getRecommendations();
          } catch (err: any) {
            // Fallback to trending if recommendations fail (e.g. 401/403)
            console.warn(
              "[PlayerStore] Recommendations failed, falling back to trending.",
            );
            res = await musicApi.interactions.getTrending();
          }
        } else {
          // Unauthenticated: Get trending songs
          res = await musicApi.interactions.getTrending();
        }

        if (res?.success && res?.data?.data) {
          const recs = mapListToPlayerSongs(res.data.data);
          playerActions.setQueue(recs);

          if (!currentSong && recs.length > 0) {
            playerActions.play(recs[0]);
            playerActions.setIsPlaying(false);
          }
        }
      } catch (err) {
        console.error("[PlayerStore] Failed to init queue:", err);
      }
    }
  },

  next: () => {
    const { queue, lastQueueIndex, isShuffle, repeatMode, currentSong } =
      playerStore.state;
    if (queue.length === 0) return;

    if (repeatMode === "one" && currentSong) {
      playerActions.play(currentSong);
      return;
    }

    let nextIdx = lastQueueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    }

    if (nextIdx < queue.length) {
      playerActions.play(queue[nextIdx]);
    } else if (repeatMode === "all") {
      playerActions.play(queue[0]);
    } else {
      playerActions.setIsPlaying(false);
    }
  },

  previous: () => {
    const { queue, lastQueueIndex, currentTime } = playerStore.state;
    if (currentTime > 3) {
      playerActions.setCurrentTime(0);
      return;
    }

    const prevIdx = lastQueueIndex - 1;
    if (prevIdx >= 0) {
      playerActions.play(queue[prevIdx]);
    }
  },

  setIsPlaying: (isPlaying: boolean) => {
    playerStore.setState((s) => ({ ...s, isPlaying }));
  },

  setCurrentTime: (time: number) => {
    playerStore.setState((s) => ({ ...s, currentTime: time }));
  },

  setDuration: (duration: number) => {
    playerStore.setState((s) => ({ ...s, duration }));
  },

  setVolume: (v: number) => {
    playerStore.setState((s) => ({ ...s, volume: v, isMuted: v === 0 }));
  },

  setIsMuted: (isMuted: boolean) => {
    playerStore.setState((s) => ({ ...s, isMuted }));
  },

  setQualityTracks: (tracks: any[]) => {
    playerStore.setState((s) => ({ ...s, qualityTracks: tracks }));
  },

  setSelectedQuality: (quality: "auto" | number) => {
    playerStore.setState((s) => ({ ...s, selectedQuality: quality }));
  },

  toggleLyrics: () => {
    playerStore.setState((s) => ({ ...s, isLyricsOpen: !s.isLyricsOpen }));
  },

  toggleShuffle: () => {
    playerStore.setState((s) => ({ ...s, isShuffle: !s.isShuffle }));
  },

  toggleRepeat: () => {
    playerStore.setState((s) => {
      const modes: ("none" | "one" | "all")[] = ["none", "all", "one"];
      const nextMode = modes[(modes.indexOf(s.repeatMode) + 1) % modes.length];
      return { ...s, repeatMode: nextMode };
    });
  },

  recordListen: async (songId: string, part: number) => {
    const { systemUser } = playerStore.state;
    if (systemUser?.id && songId) {
      console.log(
        `[PlayerStore] 🎵 Initiating recordListen: song=${songId}, part=${part}%, user=${systemUser.id}`,
      );
      try {
        await musicApi.interactions.recordListen(songId, part);
        console.log(`[PlayerStore] ✅ recordListen success for ${songId}`);
      } catch (err) {
        console.error("[PlayerStore] ❌ Failed to record listen:", err);
      }
    } else {
      console.warn(
        "[PlayerStore] ⚠️ Cannot record listen: systemUser.id or songId missing",
        { userId: systemUser?.id, songId },
      );
    }
  },

  fetchFavourites: async () => {
    const { systemUser } = playerStore.state;
    if (!systemUser?.id) return;
    try {
      const res = await musicApi.users.getFavourites(1, 100);
      const ids = res.data.data.map((s: any) => s.id);
      playerStore.setState((s) => ({ ...s, favourites: new Set(ids) }));
    } catch (err: any) {
      console.error("[PlayerStore] Failed to fetch favourites:", err);
      // Auto-heal session if backend rejects signature
      if (err?.response?.status === 400 || err?.response?.status === 401) {
        console.warn("[PlayerStore] Invalid signature detected. Purging session.");
        playerActions.clearSystemSession();
      }
    }
  },

  toggleFavourite: async (songId: string) => {
    const { systemUser, favourites } = playerStore.state;
    if (!systemUser?.id) return;

    const isFav = favourites.has(songId);
    try {
      if (isFav) {
        await musicApi.users.removeFavourite(songId);
        playerStore.setState((s) => {
          const next = new Set(s.favourites);
          next.delete(songId);
          return { ...s, favourites: next };
        });
      } else {
        await musicApi.users.addFavourite(songId);
        playerStore.setState((s) => {
          const next = new Set(s.favourites);
          next.add(songId);
          return { ...s, favourites: next };
        });
      }
    } catch (err: any) {
      console.error("[PlayerStore] Toggle favourite failed:", err);
      if (err?.response?.status === 400 || err?.response?.status === 401) {
        console.warn("[PlayerStore] Invalid signature detected. Purging session.");
        playerActions.clearSystemSession();
      }
      throw err;
    }
  },
};
