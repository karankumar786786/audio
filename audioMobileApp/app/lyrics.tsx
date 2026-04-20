import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { usePlayer, usePlayerProgress } from '../lib/player-context';
import { capitalize } from '../lib/utils';
import { parseVTT, LyricCue } from '../lib/lyrics';
import { getImageUrl } from '../lib/image-utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LyricsScreen() {
  const insets = useSafeAreaInsets();
  const {
    currentSong,
    isPlaying,
    isBuffering,
    baseUrl,
    togglePlayPause,
    seekTo,
    activeTrack,
    playNext,
    playPrevious,
  } = usePlayer();
  const { position, duration } = usePlayerProgress();

  const [lyrics, setLyrics] = useState<LyricCue[]>([]);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  const [activeCueIndex, setActiveCueIndex] = useState(-1);
  const lyricsScrollRef = useRef<ScrollView>(null);
  const cueRefs = useRef<Record<number, number>>({});

  useEffect(() => {
    if (!baseUrl) {
      setLyrics([]);
      setIsFetchingLyrics(false);
      return;
    }
    const captionUrl = `${baseUrl}/caption.vtt`;

    let cancelled = false;
    setIsFetchingLyrics(true);

    const xhr = new XMLHttpRequest();
    xhr.open('GET', captionUrl);
    xhr.timeout = 10000;
    xhr.setRequestHeader('Accept', 'text/vtt, text/plain, */*');
    xhr.setRequestHeader('Cache-Control', 'no-cache');

    xhr.onload = () => {
      if (cancelled) return;
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
        const cues = parseVTT(xhr.responseText);
        setLyrics(cues);
      } else {
        setLyrics([]);
      }
      setIsFetchingLyrics(false);
    };

    xhr.onerror = () => {
      if (cancelled) return;
      setLyrics([]);
      setIsFetchingLyrics(false);
    };

    xhr.ontimeout = () => {
      if (cancelled) return;
      setLyrics([]);
      setIsFetchingLyrics(false);
    };

    xhr.send();

    return () => {
      cancelled = true;
      xhr.abort();
    };
  }, [baseUrl]);

  useEffect(() => {
    if (lyrics.length === 0) return;
    let found = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (position >= lyrics[i].start && position <= lyrics[i].end) {
        found = i;
        break;
      }
    }
    if (found !== activeCueIndex) {
      setActiveCueIndex(found);
      if (found !== -1 && cueRefs.current[found] !== undefined && lyricsScrollRef.current) {
        lyricsScrollRef.current.scrollTo({
          y: Math.max(0, cueRefs.current[found] - SCREEN_HEIGHT * 0.4),
          animated: true,
        });
      }
    }
  }, [position, lyrics, activeCueIndex]);

  const formatTime = (secs: number) => {
    if (!isFinite(secs) || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;
  const coverImage = getImageUrl(currentSong?.imageKey, { width: 800, height: 800, blur: 50 });

  if (!currentSong) {
    return (
      <View className="flex-1 bg-black">
        <View
          className="flex-1 items-center justify-center"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <StatusBar style="light" />
        <Ionicons name="musical-notes" size={48} color="#08f808" />
        <Text className="mt-4 font-bold text-zinc-500">No active signal</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-8 rounded-full border border-white/10 bg-zinc-900 px-8 py-3">
          <Text className="font-bold text-white">Go Back</Text>
        </Pressable>
      </View>
    </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {coverImage ? (
        <Image source={{ uri: coverImage }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} blurRadius={80} resizeMode="cover" />
      ) : null}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)' }} />
      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <StatusBar style="light" />
        
        <View className="flex-row items-center justify-between px-8 pb-8 pt-6">
          <Pressable onPress={() => router.back()} className="h-12 w-12 items-center justify-center rounded-full border border-white/[0.05] bg-white/[0.03] shadow-lg">
            <Ionicons name="chevron-down" size={26} color="#fff" />
          </Pressable>
          <View className="flex-1 items-center px-6">
            <Text className="text-center text-lg font-black tracking-tight text-white" numberOfLines={1}>
              {capitalize(currentSong.title)}
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Text className="text-xs font-bold text-[#08f808]" numberOfLines={1}>
                {capitalize(currentSong.artistName)}
              </Text>
              {activeTrack && (
                <View className="rounded-full border border-[#08f808]/20 bg-[#08f808]/10 px-2 py-0.5">
                  <Text className="text-[10px] font-black text-[#08f808]">
                    {activeTrack.size.height}p
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View className="w-12" />
        </View>

        <ScrollView ref={lyricsScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 120, paddingHorizontal: 40 }} className="flex-1">
          {isFetchingLyrics ? (
            <View className="items-center justify-center py-24">
              <ActivityIndicator color="#08f808" size="large" />
            </View>
          ) : lyrics.length > 0 ? (
            lyrics.map((cue, index) => {
              const isActive = index === activeCueIndex;
              const isPast = index < activeCueIndex;
              return (
                <Pressable key={index} onPress={() => seekTo(cue.start)} onLayout={(e) => { cueRefs.current[index] = e.nativeEvent.layout.y; }} className="mb-10">
                  <Text style={{ fontSize: isActive ? 34 : 26, fontWeight: '900', color: isActive ? '#ffffff' : isPast ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.45)', opacity: isActive ? 1 : isPast ? 0.3 : 0.6, lineHeight: isActive ? 46 : 38, letterSpacing: -0.5 }}>
                    {cue.text}
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <View className="items-center justify-center py-24">
              <Ionicons name="document-text-outline" size={48} color="#1a1a1a" />
              <Text className="mt-6 text-sm font-black uppercase tracking-widest text-zinc-700">No signals detected</Text>
            </View>
          )}
        </ScrollView>

        <View className="px-10 pb-12 pt-6">
          <View className="mb-8">
            <Pressable onPress={(e) => { const x = e.nativeEvent.locationX; const barWidth = SCREEN_WIDTH - 80; const ratio = Math.max(0, Math.min(1, x / barWidth)); seekTo(ratio * duration); }} className="h-1.5 rounded-full bg-white/10">
              <View className="h-full rounded-full bg-[#08f808]" style={{ width: `${progress * 100}%` }} />
            </Pressable>
            <View className="mt-4 flex-row justify-between">
              <Text className="text-[10px] font-black tracking-widest text-[#08f808]">{formatTime(position)}</Text>
              <Text className="text-[10px] font-black tracking-widest text-zinc-500">{formatTime(duration)}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-center gap-10">
            <Pressable onPress={playPrevious} className="active:opacity-60">
              <Ionicons name="play-skip-back" size={32} color="#fff" />
            </Pressable>
            <Pressable onPress={togglePlayPause} className="h-20 w-20 items-center justify-center rounded-full bg-white active:scale-95 shadow-xl">
              {isBuffering ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={38} color="#000" style={!isPlaying ? { marginLeft: 4 } : undefined} />
              )}
            </Pressable>
            <Pressable onPress={playNext} className="active:opacity-60">
              <Ionicons name="play-skip-forward" size={32} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
