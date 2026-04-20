import { useEffect, useRef, useCallback, MutableRefObject } from "react";
import { playerActions } from "../../../store/player.store";

export function useAudioSync(
  audioElement: HTMLAudioElement | null,
  isInternalChange: MutableRefObject<boolean>,
  currentSong: any,
  isPlaying: boolean,
  volume: number,
  isMuted: boolean,
  duration: number,
  setLocalTime: (t: number) => void,
  setBuffered: (t: number) => void
) {
  const animFrameRef = useRef<number>(0);
  const lastStateRef = useRef<{ id: string; time: number; duration: number }>({
    id: "",
    time: 0,
    duration: 0,
  });

  // 1. Sync Play/Pause and Volume
  useEffect(() => {
    if (!audioElement) return;
    audioElement.volume = isMuted ? 0 : volume;
  }, [audioElement, volume, isMuted]);

  useEffect(() => {
    if (!audioElement) return;
    if (isPlaying) {
      if (audioElement.paused) {
        audioElement.play().catch((err) => {
          if (err.name !== "AbortError") console.warn("[Player] Play failed:", err);
        });
      }
    } else {
      if (!audioElement.paused && !isInternalChange.current) {
        audioElement.pause();
      }
    }
  }, [audioElement, isPlaying, currentSong?.id]);

  // 2. Native Event Listeners
  useEffect(() => {
    if (!audioElement) return;

    const onPlay = () => {
      if (isInternalChange.current || audioElement.readyState === 0) return;
      playerActions.setIsPlaying(true);
    };
    const onPause = () => {
      if (isInternalChange.current || audioElement.readyState === 0) return;
      playerActions.setIsPlaying(false);
    };
    const handleEnded = () => {
      isInternalChange.current = true;
      const last = lastStateRef.current;
      if (last.id) {
        playerActions.recordListen(last.id, 100);
        lastStateRef.current = { id: "", time: 0, duration: 0 };
      }
      playerActions.next();
    };

    audioElement.addEventListener("play", onPlay);
    audioElement.addEventListener("playing", onPlay);
    audioElement.addEventListener("pause", onPause);
    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("play", onPlay);
      audioElement.removeEventListener("playing", onPlay);
      audioElement.removeEventListener("pause", onPause);
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, [audioElement]);

  // 3. Listen Recording Logic
  useEffect(() => {
    const last = lastStateRef.current;
    if (currentSong?.id !== last.id) {
      if (last.id && last.duration > 0) {
        const part = Math.min(100, Math.floor((last.time / last.duration) * 100));
        if (part > 1 || last.time > 5) {
          playerActions.recordListen(last.id, part);
        }
      }
      lastStateRef.current = {
        id: currentSong?.id || "",
        time: 0,
        duration: currentSong?.duration || 0,
      };
    }
  }, [currentSong?.id]);

  // Record on unmount
  useEffect(() => {
    return () => {
      const last = lastStateRef.current;
      if (last.id && last.duration > 0) {
        const part = Math.min(100, Math.floor((last.time / last.duration) * 100));
        if (part > 1 || last.time > 5) {
          playerActions.recordListen(last.id, part);
        }
      }
    };
  }, []);

  // 4. High Precision Sync (RAF)
  const syncTime = useCallback(() => {
    if (!audioElement) {
      animFrameRef.current = requestAnimationFrame(syncTime);
      return;
    }
    const t = audioElement.currentTime;
    setLocalTime(t);
    playerActions.setCurrentTime(t);
    
    if (audioElement.buffered.length) {
      setBuffered(audioElement.buffered.end(audioElement.buffered.length - 1));
    }
    
    if (audioElement.duration && audioElement.duration !== duration) {
      playerActions.setDuration(audioElement.duration);
    }
    
    if (currentSong && lastStateRef.current.id === currentSong.id) {
      lastStateRef.current.time = t;
      lastStateRef.current.duration = audioElement.duration || duration || lastStateRef.current.duration;
    }
    
    animFrameRef.current = requestAnimationFrame(syncTime);
  }, [audioElement, currentSong, duration, setLocalTime, setBuffered]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(syncTime);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [syncTime]);
}
