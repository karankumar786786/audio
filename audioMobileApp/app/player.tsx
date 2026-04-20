import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  Alert,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePlayer, usePlayerProgress } from '../lib/player-context';
import { getImageUrl } from '../lib/image-utils';
import { capitalize } from '../lib/utils';
import { musicApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type QualityOption = 'auto' | 'high' | 'med' | 'low';

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const queryClient = useQueryClient();

  const {
    currentSong,
    isPlaying,
    isBuffering,
    togglePlayPause,
    seekTo,
    currentQualityType,
    setQualityType,
    playNext,
    playPrevious,
    toggleRepeat,
    repeatMode,
  } = usePlayer();
  const { position, duration, bufferedPosition } = usePlayerProgress();
  const { user } = useAuth();

  const [isLiked, setIsLiked] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [pendingQuality, setPendingQuality] = useState(currentQualityType);
  const [pendingPlaylistId, setPendingPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    if (showQualityModal) {
      setPendingQuality(currentQualityType);
    }
  }, [showQualityModal, currentQualityType]);

  const progressBarWidthRef = useRef(SCREEN_WIDTH - 80);
  const effectiveSongId = currentSong?.id ?? songId ?? '';

  const coverImage = getImageUrl(currentSong?.imageKey, { width: 800, height: 800, quality: 90 });

  const { data: favouritesData } = useQuery({
    queryKey: ['favourites'],
    queryFn: () => musicApi.users.getFavourites(1, 100),
    enabled: !!user,
  });

  useEffect(() => {
    if (favouritesData?.data?.data) {
      const liked = favouritesData.data.data.some((s: any) => s.id === effectiveSongId);
      setIsLiked(liked);
    }
  }, [favouritesData, effectiveSongId]);

  const { data: playlistsData } = useQuery({
    queryKey: ['userPlaylists'],
    queryFn: () => musicApi.users.getPlaylists(1, 50),
    enabled: showPlaylistModal,
  });

  const favMutation = useMutation({
    mutationFn: (wasLiked: boolean) =>
      wasLiked 
        ? musicApi.users.removeFavourite(effectiveSongId) 
        : musicApi.users.addFavourite(effectiveSongId),
    onMutate: () => {
      setIsLiked((prev) => !prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favourites'] });
    },
    onError: (error: any) => {
      setIsLiked((prev) => !prev);
      Alert.alert('Error', 'Failed to update favourites');
    },
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: (playlistId: string) => {
      setPendingPlaylistId(playlistId);
      return musicApi.users.addSongToPlaylist(playlistId, effectiveSongId);
    },
    onSuccess: () => {
      setPendingPlaylistId(null);
      setShowPlaylistModal(false);
      Alert.alert('Synced!', 'Memory added to node');
      queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
    },
    onError: (error: any) => {
      setPendingPlaylistId(null);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to sync signal');
    },
  });

  const formatTime = (secs: number) => {
    if (!isFinite(secs) || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;
  const ART_SIZE = SCREEN_WIDTH - 48;

  if (!currentSong) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black" edges={['top', 'bottom']}>
        <Ionicons name="musical-notes" size={48} color="#08f808" />
        <Text className="mt-4 text-base text-white">No active signal</Text>
        <Pressable onPress={() => router.back()} className="mt-6 rounded-full border border-[#08f808]/20 bg-[#08f808]/10 px-6 py-3">
          <Text className="font-bold text-[#08f808]">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const playlists = playlistsData?.data?.data || playlistsData?.data || [];
  const qualityOptions: { id: QualityOption; label: string; icon: keyof typeof Ionicons.glyphMap; description: string; }[] = [
    { id: 'auto', label: 'Auto', icon: 'flash-outline', description: 'Adaptive Bitrate' },
    { id: 'high', label: 'High', icon: 'star-outline', description: 'Lossless Node' },
    { id: 'med', label: 'Medium', icon: 'bar-chart-outline', description: 'Stable Signal' },
    { id: 'low', label: 'Low', icon: 'leaf-outline', description: 'Compressed Bandwidth' },
  ];

  return (
    <View className="flex-1 bg-black">
      {coverImage ? (
        <Image source={{ uri: coverImage }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} blurRadius={80} resizeMode="cover" />
      ) : null}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
      <StatusBar style="light" />
      
      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* Header */}
        <View className="flex-row justify-between px-8 pb-8 pt-4">
          <View className="gap-4">
            <Pressable onPress={() => router.back()} className="h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] shadow-lg">
              <Ionicons name="chevron-down" size={26} color="#fff" />
            </Pressable>
            <Pressable onPress={() => setShowQualityModal(true)} className={`h-12 w-12 items-center justify-center rounded-full border shadow-lg ${currentQualityType === 'auto' ? 'border-white/[0.08] bg-white/[0.03]' : 'border-[#08f808]/30 bg-[#08f808]/10'}`}>
              <Ionicons name="options-outline" size={24} color={currentQualityType === 'auto' ? '#a1a1aa' : '#08f808'} />
            </Pressable>
          </View>
          <View className="flex-1 items-center pt-3">
            <Text className="text-[11px] font-black uppercase tracking-[0.3em] text-[#08f808]">Syncing Signal</Text>
          </View>
          <Pressable onPress={() => setShowPlaylistModal(true)} className="h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] shadow-lg">
            <Ionicons name="add" size={28} color="#08f808" />
          </Pressable>
        </View>

        {/* Album Art */}
        <View className="flex-1 items-center justify-center px-10">
          <View style={{ width: ART_SIZE, height: ART_SIZE, borderRadius: 40 }} className="overflow-hidden border border-white/[0.1] bg-[#1a1a1a] shadow-2xl">
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View className="flex-1 items-center justify-center bg-[#08f808]/5">
                <Ionicons name="musical-notes" size={100} color="#08f808" />
              </View>
            )}
          </View>
        </View>

        {/* Info + Controls */}
        <View className="px-10 pb-12 pt-10">
          <View className="mb-10 flex-row items-center justify-between">
            <View className="mr-6 flex-1">
              <Text className="text-3xl font-black tracking-tighter text-white" numberOfLines={1}>{capitalize(currentSong.title || '')}</Text>
              <Text className="mt-2 text-lg font-bold text-zinc-400" numberOfLines={1}>{capitalize(currentSong.artistName || '')}</Text>
            </View>
            <Pressable onPress={() => favMutation.mutate(isLiked)} disabled={favMutation.isPending} className="h-14 w-14 items-center justify-center rounded-full">
              {favMutation.isPending ? (
                <ActivityIndicator color="#08f808" size="small" />
              ) : (
                <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={28} color={isLiked ? '#ef4444' : '#fff'} />
              )}
            </Pressable>
          </View>

          {/* Progress Bar */}
          <View className="mb-10">
            <Pressable onLayout={(e: LayoutChangeEvent) => { progressBarWidthRef.current = e.nativeEvent.layout.width; }} onPress={(e) => { const x = e.nativeEvent.locationX; const ratio = Math.max(0, Math.min(1, x / progressBarWidthRef.current)); seekTo(ratio * duration); }} className="h-2 rounded-full bg-white/10">
              <View className="absolute h-full rounded-full bg-white/20" style={{ width: `${duration > 0 ? (bufferedPosition / duration) * 100 : 0}%` }} />
              <View className="h-full rounded-full bg-[#08f808]" style={{ width: `${progress * 100}%` }} />
              <View className="absolute -top-1.5 h-5 w-5 items-center justify-center" style={{ left: `${progress * 100}%`, marginLeft: -10 }}>
                <View className="h-4 w-4 rounded-full border-2 border-[#08f808] bg-black" />
              </View>
            </Pressable>
            <View className="mt-4 flex-row justify-between">
              <Text className="text-[10px] font-black tracking-widest text-[#08f808]">{formatTime(position)}</Text>
              <Text className="text-[10px] font-black tracking-widest text-zinc-500">{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Playback Controls */}
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.push('/lyrics')} className="h-12 w-12 items-center justify-center rounded-2xl bg-white/5 active:bg-white/10">
              <Ionicons name="text-outline" size={22} color="#fff" />
            </Pressable>
            
            <View className="flex-row items-center gap-8">
              <Pressable onPress={playPrevious} className="active:opacity-60">
                <Ionicons name="play-skip-back" size={32} color="#fff" />
              </Pressable>
              
              <Pressable onPress={togglePlayPause} className="h-20 w-20 items-center justify-center rounded-full bg-[#08f808] shadow-2xl active:scale-95 shadow-[#08f808]/20">
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

            <Pressable onPress={toggleRepeat} className="h-12 w-12 items-center justify-center rounded-2xl active:bg-white/10">
              <Ionicons name="repeat" size={22} color={repeatMode !== 'none' ? '#08f808' : '#fff'} />
              {repeatMode === 'one' && (
                <View className="absolute bottom-2 h-3.5 w-3.5 items-center justify-center rounded-full bg-[#08f808]">
                  <Text className="text-[8px] font-black text-black">1</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Quality Modal */}
        <Modal visible={showQualityModal} animationType="fade" transparent>
          <View className="flex-1 items-center justify-center px-8">
            <Pressable onPress={() => setShowQualityModal(false)} className="absolute inset-0 bg-black/80" />
            <View className="w-full overflow-hidden rounded-[40px] border border-white/[0.1] bg-[#0a0a0a] p-10 shadow-2xl">
              <View className="mb-10 flex-row items-center justify-between">
                <Text className="text-2xl font-black tracking-tighter text-white">Frequency Rank</Text>
                <Pressable onPress={() => setShowQualityModal(false)} className="h-10 w-10 items-center justify-center rounded-full bg-white/[0.05]">
                  <Ionicons name="close" size={24} color="#52525b" />
                </Pressable>
              </View>
              <View className="mb-10 gap-2.5">
                {qualityOptions.map((opt) => (
                  <Pressable key={opt.id} onPress={() => setPendingQuality(opt.id as QualityOption)} className={`flex-row items-center justify-between rounded-3xl border px-6 py-4.5 ${pendingQuality === opt.id ? 'border-[#08f808]/40 bg-[#08f808]/10' : 'border-white/[0.05] bg-white/[0.03]'}`}>
                    <View className="flex-row items-center gap-4">
                      <Ionicons name={opt.icon} size={20} color={pendingQuality === opt.id ? '#08f808' : '#3f3f46'} />
                      <View>
                        <Text className={`text-lg font-black tracking-tight ${pendingQuality === opt.id ? 'text-white' : 'text-zinc-500'}`}>{opt.label}</Text>
                        <Text className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{opt.description}</Text>
                      </View>
                    </View>
                    {pendingQuality === opt.id && <Ionicons name="checkmark-circle" size={22} color="#08f808" />}
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={() => { setQualityType(pendingQuality); setShowQualityModal(false); }} className="h-16 items-center justify-center rounded-[24px] bg-[#08f808] active:opacity-90 shadow-lg shadow-[#08f808]/20">
                <Text className="text-lg font-black text-black">Update Stream</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Playlist Modal */}
        <Modal visible={showPlaylistModal} animationType="slide" transparent>
          <View className="flex-1 justify-end">
            <Pressable onPress={() => setShowPlaylistModal(false)} className="absolute inset-0 bg-black/70" />
            <View className="overflow-hidden rounded-t-[48px] border-t border-white/[0.1] bg-[#0a0a0a] px-8 pb-14 pt-10 shadow-2xl">
              <View className="mb-8 items-center">
                <View className="mb-6 h-1.5 w-12 rounded-full bg-white/10" />
                <Text className="text-3xl font-black tracking-tighter text-white">Sync Node</Text>
              </View>
              {playlists.length === 0 ? (
                 <View className="mb-6 items-center py-10 rounded-3xl border border-white/[0.02]">
                    <Ionicons name="radio-outline" size={48} color="#18181b" />
                    <Text className="mt-4 text-base font-bold text-zinc-600">No active nodes</Text>
                 </View>
              ) : (
                <FlatList data={playlists} keyExtractor={(item: any) => item.id} style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false} renderItem={({ item }: { item: any }) => (
                  <Pressable onPress={() => addToPlaylistMutation.mutate(item.id)} disabled={pendingPlaylistId === item.id} className="mb-2 flex-row items-center gap-4 rounded-3xl px-3 py-4 active:bg-[#08f808]/5">
                    <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                      <Ionicons name="musical-notes" size={24} color="#08f808" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[17px] font-black tracking-tight text-white" numberOfLines={1}>{capitalize(item.name || item.title)}</Text>
                    </View>
                    {pendingPlaylistId === item.id ? ( <ActivityIndicator color="#08f808" size="small" /> ) : (
                      <Ionicons name="add" size={26} color="#3f3f46" />
                    )}
                  </Pressable>
                )} />
              )}
              <Pressable onPress={() => setShowPlaylistModal(false)} className="mt-6 h-16 items-center justify-center rounded-[24px] bg-white active:scale-[0.98]">
                <Text className="text-lg font-black text-black">Dismiss</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}