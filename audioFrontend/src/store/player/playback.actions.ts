import { playerStore } from "./index";
import { type PlayerSong } from "@/lib/player-utils";
import { musicApi } from "@/lib/api";

export const playbackActions = {
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
      try {
        await musicApi.interactions.recordListen(songId, part);
      } catch (err) {
        console.error("[PlayerStore] Failed to record listen:", err);
      }
    }
  },
};
