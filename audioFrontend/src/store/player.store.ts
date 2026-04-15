import { Store } from "@tanstack/react-store";
import { type Song } from "../lib/api";

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  progress: number; // 0 to 100
  duration: number; // actual seconds
  currentTime: number; // actual seconds
  isLyricsOpen: boolean;
  queue: Song[];
}

export const playerStore = new Store<PlayerState>({
  currentSong: null,
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,
  currentTime: 0,
  isLyricsOpen: false,
  queue: [],
});

export const playerActions = {
  play: (song?: Song) => {
    playerStore.setState((s) => ({
      ...s,
      currentSong: song || s.currentSong,
      isPlaying: true,
    }));
  },
  
  pause: () => {
    playerStore.setState((s) => ({ ...s, isPlaying: false }));
  },
  
  setVolume: (v: number) => {
    playerStore.setState((s) => ({ ...s, volume: v }));
  },
  
  setProgress: (currentTime: number, duration: number) => {
    playerStore.setState((s) => ({
      ...s,
      currentTime,
      duration,
      progress: (currentTime / duration) * 100 || 0,
    }));
  },
  
  toggleLyrics: () => {
    playerStore.setState((s) => ({ ...s, isLyricsOpen: !s.isLyricsOpen }));
  },
  
  setQueue: (songs: Song[]) => {
    playerStore.setState((s) => ({ ...s, queue: songs }));
  }
};
