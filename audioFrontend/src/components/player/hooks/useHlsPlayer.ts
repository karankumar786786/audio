import { useEffect, useRef, useCallback } from "react";
import { playerActions } from "../../../store/player.store";
import { toast } from "sonner";

export function useHlsPlayer(
  audioElement: HTMLAudioElement | null,
  currentSongId: string | undefined,
  streamUrl: string | undefined,
  isPlaying: boolean,
  selectedQuality: "auto" | number
) {
  const hlsRef = useRef<any>(null);
  const isInternalChange = useRef(false);

  const syncTracks = useCallback((hls: any) => {
    if (!hls) return;
    const levels = hls.levels || [];
    const tracks = levels.map((level: any, idx: number) => ({
      index: idx,
      bandwidth: level.bitrate,
      label: level.name || `${Math.round(level.bitrate / 1000)}K`,
    }));
    playerActions.setQualityTracks(tracks);
  }, []);

  // Initialize and Load
  useEffect(() => {
    if (!audioElement) return;

    let isMounted = true;
    let hlsInstance: any = null;

    const initPlayer = async () => {
      try {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        if (streamUrl) {
          console.log("[Player] Loading stream URL:", streamUrl);
          isInternalChange.current = true;

          // Check for native HLS support (Safari)
          if (audioElement.canPlayType("application/vnd.apple.mpegurl")) {
            audioElement.src = streamUrl;
            playerActions.setQualityTracks([]); // No manual tracks for native Safari HLS
            
            if (isPlaying) {
              audioElement.play().catch((err) => {
                console.warn("[Player] Native HLS autoplay failed:", err);
              });
            }
          } else {
            // Dynamic import of hls.js only on client side to prevent Next.js SSR errors
            const HlsModule = await import("hls.js");
            const Hls = HlsModule.default;

            if (Hls.isSupported()) {
              hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
              });
              hlsRef.current = hlsInstance;

              hlsInstance.attachMedia(audioElement);

              hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
                if (isMounted) {
                  hlsInstance.loadSource(streamUrl);
                }
              });

              hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                if (!isMounted) return;
                syncTracks(hlsInstance);

                if (isPlaying) {
                  audioElement.play().catch((err) => {
                    console.warn("[Player] Hls.js autoplay failed:", err);
                  });
                }
              });

              hlsInstance.on(Hls.Events.ERROR, (event: any, data: any) => {
                if (!isMounted) return;
                console.error("[Hls.js] ❌ Error details:", data);

                if (data.fatal) {
                  switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                      console.warn("[Hls.js] Fatal network error, trying to recover...");
                      hlsInstance.startLoad();
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      console.warn("[Hls.js] Fatal media error, trying to recover...");
                      hlsInstance.recoverMediaError();
                      break;
                    default:
                      console.error("[Hls.js] Unrecoverable fatal error:", data.details);
                      toast.error("Playback error", {
                        description: `Unrecoverable error: ${data.details}.`,
                      });
                      hlsInstance.destroy();
                      hlsRef.current = null;
                      break;
                  }
                }
              });
            } else {
              toast.error("HLS playback is not supported in this browser.");
            }
          }

          setTimeout(() => {
            if (isMounted) isInternalChange.current = false;
          }, 500);
        } else {
          audioElement.src = "";
        }
      } catch (e: any) {
        console.error("[Player] ❌ Hls.js Lifecycle Error:", e);
        isInternalChange.current = false;
      }
    };

    initPlayer();

    return () => {
      isMounted = false;
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSongId, streamUrl, audioElement]);

  // Quality Switching
  useEffect(() => {
    if (!hlsRef.current) return;
    const hls = hlsRef.current;

    if (selectedQuality === "auto") {
      hls.currentLevel = -1; // -1 represents AUTO level selection
    } else {
      const idx = hls.levels.findIndex((level: any) => level.bitrate === selectedQuality);
      if (idx !== -1) {
        hls.currentLevel = idx;
      }
    }
  }, [selectedQuality, currentSongId]);

  return { player: hlsRef.current, isInternalChange };
}
