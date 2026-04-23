import { useEffect, useRef, useCallback } from "react";
// @ts-ignore
// Removed top-level import to prevent SSR navigator errors
// import shaka from "shaka-player";
import { playerActions } from "../../../store/player.store";
import { toast } from "sonner";

export function useShakaPlayer(audioElement: HTMLAudioElement | null, currentSongId: string | undefined, streamUrl: string | undefined, isPlaying: boolean, selectedQuality: "auto" | number) {
  const playerRef = useRef<any>(null);
  const isInternalChange = useRef(false);

  const syncTracks = useCallback(() => {
    if (!playerRef.current) return;
    const tracks = playerRef.current.getVariantTracks();
    const unique = tracks
      .filter(
        (t: any, idx: number, self: any[]) =>
          self.findIndex((x: any) => x.bandwidth === t.bandwidth) === idx,
      )
      .sort((a: any, b: any) => a.bandwidth - b.bandwidth);
    playerActions.setQualityTracks(unique);
  }, []);

  // Initialize and Load
  useEffect(() => {
    if (!audioElement) return;

    let isMounted = true;

    const runLifecycle = async () => {
      try {
        if (!playerRef.current) {
          // Dynamic import of shaka-player only on the client
          const shaka = (await import("shaka-player")).default;
          shaka.polyfill.installAll();
          const player = new shaka.Player();
          playerRef.current = player;

          player.configure({
            streaming: {
              retryParameters: { maxAttempts: 4, baseDelay: 1000, backoffFactor: 2, fuzzFactor: 0.5, timeout: 30000 },
            },
            manifest: {
              retryParameters: { maxAttempts: 4, baseDelay: 1000, backoffFactor: 2, fuzzFactor: 0.5, timeout: 30000 },
            },
          });

          player.addEventListener("error", (e: any) => {
            console.error("[Shaka] ❌ Engine error:", e.detail);
            const code = e.detail.code;
            let message = "Playback error";
            if (code === 1001) message = "Manifest fetch failed (Network/CORS)";
            if (code === 403) message = "Access denied (Invalid token)";
            toast.error(message, { description: `Error code: ${code}. Check backend logs.` });
          });

          player.addEventListener("trackschanged", syncTracks);
          await player.attach(audioElement);
        }

        const player = playerRef.current;

        if (streamUrl) {
          isInternalChange.current = true;
          await player.load(streamUrl);
          if (!isMounted) return;

          syncTracks();

          if (isPlaying) {
            try {
              await audioElement.play();
            } catch (err) {
              console.warn("[Player] ⚠️ Playback start failed:", err);
            }
          }

          setTimeout(() => {
            if (isMounted) isInternalChange.current = false;
          }, 500);
        } else {
          // If streamUrl is cleared, ensure player stops
          await player.unload();
        }
      } catch (e) {
        console.error("[Player] ❌ Unified Lifecycle Error:", e);
        isInternalChange.current = false;
      }
    };

    runLifecycle();

    return () => {
      isMounted = false;
    };
  }, [currentSongId, streamUrl, audioElement]);

  // Quality Switching
  useEffect(() => {
    if (!playerRef.current) return;
    const player = playerRef.current;

    if (selectedQuality === "auto") {
      player.configure({ abr: { enabled: true } });
    } else {
      player.configure({ abr: { enabled: false } });
      const tracks = player.getVariantTracks();
      const track = tracks.find((t: any) => t.bandwidth === selectedQuality);
      if (track) {
        player.selectVariantTrack(track, true);
      }
    }
  }, [selectedQuality, currentSongId]);

  return { player: playerRef.current, isInternalChange };
}
