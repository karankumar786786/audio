import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { musicApi } from '../../lib/api';
import SongRow from '../../components/SongRow';
import { usePlayerActions } from '../../lib/player-context';
import { getImageUrl } from '../../lib/image-utils';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';

const mapToPlayerSong = (s: any) => ({
  id: s.id,
  title: s.title,
  artistName: s.artistName,
  songKey: s.songKey,
  imageKey: s.imageKey,
  coverUrl: getImageUrl(s.imageKey, { width: 400, height: 400, crop: 'at_max' }) || null,
});

export default function Favourites() {
  const { playAll } = usePlayerActions();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['favourites', 'paginated'],
      queryFn: ({ pageParam = 1 }) => musicApi.users.getFavourites(pageParam, 20),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        const pagination = lastPage?.data?.pagination || lastPage?.pagination;
        if (!pagination || !pagination.hasNext) return undefined;
        return pagination.page + 1;
      },
    });

  const removeFavMutation = useMutation({
    mutationFn: (songId: string) => musicApi.users.removeFavourite(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favourites'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to remove from sync');
    },
  });

  const favorites = data?.pages?.flatMap((page) => page.data?.data || page.data || []) || [];

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handlePlayAll = useCallback(() => {
    if (favorites.length === 0) return;
    const playerSongs = favorites.map(mapToPlayerSong);
    playAll(playerSongs as any);
  }, [favorites, playAll]);

  const MemoizedHeader = useMemo(
    () => (
      <View className="px-6 pb-4 pt-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-4xl font-black tracking-tighter text-white">Synced Signals</Text>
            <Text className="mt-1 text-sm font-bold text-zinc-500">
              {favorites.length} active mappings
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            {isFetching && !isFetchingNextPage && !isLoading && (
              <ActivityIndicator color="#08f808" size="small" />
            )}
            {favorites.length > 0 && (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(8,248,8,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(8,248,8,0.15)',
                }}>
                <Ionicons name="heart" size={20} color="#08f808" />
              </View>
            )}
          </View>
        </View>

        {favorites.length > 0 && (
          <Pressable
            onPress={handlePlayAll}
            style={{
              marginTop: 20,
              shadowColor: '#08f808',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            }}
            className="h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-[#08f808] active:opacity-80">
            <Ionicons name="play" size={22} color="#000" style={{ marginLeft: 3 }} />
            <Text style={{ letterSpacing: 2 }} className="text-[13px] font-black uppercase text-black">
              Sync All
            </Text>
          </Pressable>
        )}
      </View>
    ),
    [favorites, isFetching, isFetchingNextPage, isLoading, handlePlayAll]
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <SongRow
        song={mapToPlayerSong(item)}
        index={index}
        renderRightAction={() => (
          <Pressable
            onPress={() => {
              Alert.alert('Remove Sync', 'Are you sure you want to remove this signal?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => removeFavMutation.mutate(item.id),
                },
              ]);
            }}
            disabled={removeFavMutation.isPending}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
            }}>
            {removeFavMutation.isPending && removeFavMutation.variables === item.id ? (
              <ActivityIndicator color="#ef4444" size="small" />
            ) : (
              <Ionicons name="heart" size={19} color="#ef4444" />
            )}
          </Pressable>
        )}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <LinearGradient
        colors={['#1a1a1a', '#050505']}
        className="absolute inset-0"
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      />

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={MemoizedHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? null : (
            <View className="items-center py-24">
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.06)',
                  marginBottom: 20,
                }}>
                <Ionicons name="heart-outline" size={40} color="#3f3f46" />
              </View>
              <Text className="text-lg font-black tracking-tight text-zinc-400">
                No signals synced
              </Text>
              <Text className="mt-2 px-12 text-center text-sm font-medium text-zinc-600">
                Initialize a signal mapping by tapping the heart icon on any song.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#08f808" size="small" />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#08f808"
          />
        }
      />
    </SafeAreaView>
  );
}