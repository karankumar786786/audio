import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { musicApi } from '../lib/api';
import { getImageUrl } from '../lib/image-utils';
import { capitalize } from '../lib/utils';
import { usePlayer } from '../lib/player-context';
import { LinearGradient } from 'expo-linear-gradient';

const mapToPlayerSong = (s: any) => ({
  id: s.id,
  title: s.title,
  artistName: s.artistName,
  songKey: s.songKey,
  imageKey: s.imageKey,
  coverUrl: getImageUrl(s.imageKey, { width: 400, height: 400, crop: 'at_max' }) || null,
});

export default function HistoryScreen() {
  const { play } = usePlayer();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['history'],
      queryFn: ({ pageParam = 1 }) => musicApi.users.getHistory(pageParam, 50),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        const pagination = lastPage?.data?.pagination || lastPage?.pagination;
        if (!pagination || !pagination.hasNext) return undefined;
        return pagination.page + 1;
      },
    });

  const history = data?.pages?.flatMap((page) => page.data?.data || page.data || []) || [];

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && history.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={['top']}>
        <View className="px-5 pb-6 pt-4">
           <View className="h-10 w-48 rounded-xl bg-zinc-900" />
        </View>
        <View className="mt-2 gap-3 px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} className="flex-row items-center gap-3 px-4 py-3">
              <View className="h-14 w-14 rounded-xl bg-zinc-900" />
              <View className="flex-1 gap-2">
                <View className="h-4 w-3/4 rounded bg-zinc-900" />
                <View className="h-3 w-1/2 rounded bg-zinc-900" />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const song = item.song || item;
    if (!song?.id) return null;
    const coverUrl = getImageUrl(song.imageKey || song.storageKey, { width: 200, height: 200 });

    return (
      <View className="px-4 py-1">
        <Pressable
          onPress={() => {
            play(mapToPlayerSong(song));
          }}
          className="flex-row items-center gap-4 rounded-3xl p-3 active:bg-white/10">
          <View className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <View className="h-full w-full items-center justify-center bg-zinc-800">
                <Ionicons name="musical-notes-outline" size={24} color="#3f3f46" />
              </View>
            )}
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[17px] font-black tracking-tight text-white" numberOfLines={1}>
              {capitalize(song.title)}
            </Text>
            <Text className="mt-0.5 text-[13px] font-medium text-zinc-500" numberOfLines={1}>
              {capitalize(song.artistName)}
            </Text>
          </View>
          <View className="items-end gap-1.5">
            {item.viewedAt && (
              <Text className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                {new Date(item.viewedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            )}
            <View className="h-8 w-8 items-center justify-center rounded-full bg-white/5">
              <Ionicons name="play" size={14} color="#08f808" className="ml-0.5" />
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <LinearGradient
        colors={['#1a1a1a', '#000000']}
        className="absolute inset-0 h-1/2"
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View className="px-5 pb-6 pt-4">
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-xl">
            <Ionicons name="chevron-back" size={24} color="white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-3xl font-black tracking-tighter text-white">Playback Feed</Text>
            <View className="mt-1 flex-row items-center gap-2">
              <View className="h-1 w-1 rounded-full bg-[#08f808]" />
              <Text className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                {history.length} signals tracked
              </Text>
            </View>
          </View>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item, i) => item?.id || `h-${i}`}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          isLoading ? null : (
            <View className="items-center py-20">
              <View className="mb-5 h-24 w-24 items-center justify-center rounded-full border border-white/5 bg-zinc-900/60">
                <Ionicons name="time-outline" size={40} color="#3f3f46" />
              </View>
              <Text className="text-lg font-bold text-zinc-400">Feed empty</Text>
              <Text className="mt-2 px-12 text-center text-sm text-zinc-600">
                Your signal interactions will be mapped here.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#08f808" />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#08f808" />
        }
      />
    </SafeAreaView>
  );
}
