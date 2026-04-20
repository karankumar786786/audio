"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@tanstack/react-store";
import { playerStore, playerActions } from "../store/player.store";
import { Music } from "lucide-react";
import { getImageUrl } from "../lib/image-utils";
import { PlaylistPickerModal } from "./PlaylistPickerModal";
import { toast } from "sonner";

// Hooks
import { useShakaPlayer } from "./player/hooks/useShakaPlayer";
import { useLyrics } from "./player/hooks/useLyrics";
import { useAudioSync } from "./player/hooks/useAudioSync";

// Components
import { PlayerBackground } from "./player/PlayerBackground";
import { PlayerAlbumArt } from "./player/PlayerAlbumArt";
import { PlayerTrackInfo } from "./player/PlayerTrackInfo";
import { PlayerLyricsOverlay } from "./player/PlayerLyricsOverlay";
import { PlayerProgressBar } from "./player/PlayerProgressBar";
import { PlayerMainControls } from "./player/PlayerMainControls";
import { PlayerUtilityRow } from "./player/PlayerUtilityRow";

export function ShakaMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const state = useStore(playerStore, (s) => s);
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    duration,
    repeatMode,
    isShuffle,
    qualityTracks,
    selectedQuality,
    favourites,
    systemUser,
  } = state;

  const [localTime, setLocalTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  // 1. Initialize Player State
  useEffect(() => {
    playerActions.hydrate();
    playerActions.initQueue();
  }, []);

  // 2. Custom Hooks for Logic
  const { isInternalChange } = useShakaPlayer(
    audioRef.current,
    currentSong?.id,
    currentSong?.streamUrl,
    isPlaying,
    selectedQuality
  );

  const { currentCaption } = useLyrics(currentSong?.captionUrl, localTime);

  useAudioSync(
    audioRef.current,
    isInternalChange,
    currentSong,
    isPlaying,
    volume,
    isMuted,
    duration,
    setLocalTime,
    setBuffered
  );

  // 3. User Actions
  const isFavourite = currentSong ? favourites.has(currentSong.id) : false;

  useEffect(() => {
    if (systemUser?.id) {
      playerActions.fetchFavourites();
    }
  }, [systemUser?.id]);

  const handleToggleFavourite = async () => {
    if (!systemUser?.id || !currentSong) {
      toast.error("Sign in required");
      return;
    }
    if (isTogglingFav) return;

    const wasFav = isFavourite;
    setIsTogglingFav(true);

    toast.promise(playerActions.toggleFavourite(currentSong.id), {
      loading: wasFav ? "Removing from Favourites..." : "Adding to Favourites...",
      success: () => {
        setIsTogglingFav(false);
        return wasFav ? "Removed from Favourites" : "Added to Favourites";
      },
      error: () => {
        setIsTogglingFav(false);
        return "Failed to update Favourites";
      },
    });
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !duration) return;
    const val = parseFloat(e.target.value);
    audioRef.current.currentTime = val;
    setLocalTime(val);
  };

  const handleVolumeChange = (e: React.FormEvent<HTMLInputElement>) => {
    playerActions.setVolume(parseFloat(e.currentTarget.value));
  };

  // ─── Render ───
  if (!currentSong) {
    return (
      <div className="w-[380px] glass-heavy flex flex-col items-center justify-center p-10 text-center flex-none">
        <div className="w-20 h-20 rounded-3xl bg-zinc-900/80 border border-white/5 flex items-center justify-center mb-6">
          <Music className="h-8 w-8 text-zinc-700" />
        </div>
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] italic leading-relaxed">
          Select a track<br />to start playing
        </p>
      </div>
    );
  }

  // 4. Asset URLs (Gauranteed currentSong exists here)
  const optimizedPosterUrl = (currentSong.imageKey
    ? getImageUrl(currentSong.imageKey, {
        width: 720,
        height: 720,
        focus: "auto",
        aspectRatio: "1-1",
        quality: 90,
      })
    : currentSong.posterUrl) || "";

  return (
    <>
      <div className="w-[340px] glass-effect-strong border-l border-white/4 flex flex-col h-screen overflow-hidden flex-none relative z-50">
        <PlayerBackground posterUrl={optimizedPosterUrl} />
        
        <audio ref={audioRef} className="hidden" crossOrigin="anonymous" />

        <PlayerAlbumArt 
            songId={currentSong.id} 
            posterUrl={optimizedPosterUrl} 
            title={currentSong.title} 
        />

        <PlayerTrackInfo 
            title={currentSong.title}
            artistName={currentSong.artistName}
            isFavourite={isFavourite}
            onToggleFavourite={handleToggleFavourite}
            onAddToPlaylist={() => {
                if (!systemUser?.id) {
                    toast.error("Sign in required");
                    return;
                }
                setIsPlaylistModalOpen(true);
            }}
        />

        <PlayerLyricsOverlay 
            currentCaption={currentCaption} 
            localTime={localTime} 
        />

        {/* ─── Controls ─── */}
        <div className="flex-none px-6 pb-6 pt-2 space-y-4 relative z-10">
          <PlayerProgressBar 
            currentTime={localTime}
            duration={duration}
            bufferedTime={buffered}
            onChange={handleSeekChange}
          />

          <div className="space-y-4 pt-1">
            <PlayerMainControls 
              isPlaying={isPlaying}
              isLoading={state.isRefilling} // Using refill state as a proxy for generic loading if needed
              onPlayPause={() => playerActions.setIsPlaying(!isPlaying)}
              onNext={() => playerActions.next()}
              onPrev={() => playerActions.previous()}
            />

            <PlayerUtilityRow 
              isShuffle={isShuffle}
              repeatMode={repeatMode}
              onToggleShuffle={() => {
                playerActions.toggleShuffle();
                toast.success(isShuffle ? "Shuffle Off" : "Shuffle On");
              }}
              onToggleRepeat={() => {
                playerActions.toggleRepeat();
                const modes: Record<string, string> = { none: "all", all: "one", one: "none" };
                const next = modes[repeatMode] || "none";
                toast.success(`Repeat: ${next.toUpperCase()}`);
              }}
              selectedQuality={selectedQuality}
              qualityTracks={qualityTracks}
              showQualityMenu={showQualityMenu}
              setShowQualityMenu={setShowQualityMenu}
              onSelectQuality={(q) => playerActions.setSelectedQuality(q)}
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMute={() => playerActions.setIsMuted(!isMuted)}
            />
          </div>
        </div>
      </div>

      <PlaylistPickerModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        songId={currentSong.id}
        songTitle={currentSong.title}
      />
    </>
  );
}
