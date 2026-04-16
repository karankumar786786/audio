import { Store } from "@tanstack/react-store";
import { type PlayerSong } from "../lib/player-utils";
import { musicApi } from "../lib/api";

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
}

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
  systemToken: typeof window !== "undefined" ? localStorage.getItem("system_token") : null,
  systemUser: null,
});

export const playerActions = {
  setSystemSession: (token: string, user: any) => {
    localStorage.setItem("system_token", token);
    playerStore.setState((s) => ({ ...s, systemToken: token, systemUser: user }));
  },

  clearSystemSession: () => {
    localStorage.removeItem("system_token");
    playerStore.setState((s) => ({ ...s, systemToken: null, systemUser: null }));
  },

  play: (song: PlayerSong) => {
    playerStore.setState((s) => {
      const idx = s.queue.findIndex((item) => item.id === song.id);
      return {
        ...s,
        currentSong: song,
        isPlaying: true,
        lastQueueIndex: idx !== -1 ? idx : s.lastQueueIndex,
        currentTime: 0,
      };
    });
  },

  playFromQueue: (index: number) => {
    const { queue } = playerStore.state;
    if (index >= 0 && index < queue.length) {
      playerActions.play(queue[index]);
    }
  },

  setQueue: (songs: PlayerSong[]) => {
    playerStore.setState((s) => ({ ...s, queue: songs, lastQueueIndex: -1 }));
  },

  next: () => {
    const { queue, lastQueueIndex, isShuffle, repeatMode, currentSong } = playerStore.state;
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
      console.log(`[PlayerStore] 🎵 Initiating recordListen: song=${songId}, part=${part}%, user=${systemUser.id}`);
      try {
        await musicApi.interactions.recordListen(systemUser.id, songId, part);
        console.log(`[PlayerStore] ✅ recordListen success for ${songId}`);
      } catch (err) {
        console.error("[PlayerStore] ❌ Failed to record listen:", err);
      }
    } else {
      console.warn("[PlayerStore] ⚠️ Cannot record listen: systemUser.id or songId missing", { userId: systemUser?.id, songId });
    }
  },
};
