import React from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { usePlayer, usePlayerProgress } from '../lib/player-context';
import { capitalize } from '../lib/utils';

export default function MiniPlayer() {
  const { currentSong, isPlaying, isBuffering, togglePlayPause, playNext } = usePlayer();
  const { position, duration } = usePlayerProgress();

  if (!currentSong) return null;

  const progress = duration > 0 ? position / duration : 0;

  const openFullPlayer = () => {
    router.push({
      pathname: '/player',
      params: {
        songId: currentSong.id,
      },
    });
  };

  return (
    <View className="mx-4 overflow-hidden rounded-[24px] border border-white/[0.08] bg-black/80 shadow-2xl">
      <View>
        <View className="h-[2px] bg-white/[0.05]">
          <View
            className="h-full bg-[#08f808]"
            style={{ width: `${progress * 100}%` }}
          />
        </View>

        <Pressable onPress={openFullPlayer} className="flex-row items-center gap-3 px-5 py-3">
          <View className="h-12 w-12 overflow-hidden rounded-xl bg-white/[0.03] shadow-lg">
            {currentSong.coverUrl ? (
              <Image
                source={{ uri: currentSong.coverUrl }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full items-center justify-center bg-[#08f808]/10">
                <Ionicons name="musical-notes" size={20} color="#08f808" />
              </View>
            )}
          </View>

          <View className="min-w-0 flex-1">
            <Text className="text-[15px] font-black tracking-tight text-white" numberOfLines={1}>
              {capitalize(currentSong.title)}
            </Text>
            <Text className="text-[11px] font-bold text-zinc-400" numberOfLines={1}>
              {capitalize(currentSong.artistName)}
            </Text>
          </View>

          <Pressable
            onPress={togglePlayPause}
            className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-md active:scale-95"
            hitSlop={8}>
            {isBuffering ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color="#000"
                style={!isPlaying ? { marginLeft: 2 } : undefined}
              />
            )}
          </Pressable>
          <Pressable
            onPress={playNext}
            className="h-9 w-9 items-center justify-center rounded-full active:bg-white/10"
            hitSlop={6}>
            <Ionicons name="play-skip-forward" size={18} color="#52525b" />
          </Pressable>
        </Pressable>
      </View>
    </View>
  );
}
