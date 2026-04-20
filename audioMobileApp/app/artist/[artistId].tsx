import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { musicApi } from '../../lib/api';
import { getImageUrl } from '../../lib/image-utils';
import { capitalize } from '../../lib/utils';
import { usePlayerActions } from '../../lib/player-context';
import SongRow from '../../components/SongRow';
import { useMemo, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const mapToPlayerSong = (s: any) => ({
  id: s.id,
  title: s.title,
  artistName: s.artistName,
  songKey: s.songKey,
  imageKey: s.imageKey,
  coverUrl: getImageUrl(s.imageKey, { width: 400, height: 400, crop: 'at_max' }) || null,
});

export default function ArtistDetail() {
  const insets = useSafeAreaInsets();
  const { artistId } = useLocalSearchParams<{ artistId: string }>();
  const { playAll } = usePlayerActions();

  const { data: artistData, isLoading: isArtistLoading } = useQuery({
    queryKey: ['artist', artistId],
    queryFn: () => musicApi.artists.getById(artistId!),
    enabled: !!artistId,
  });

  const {
    data: songsData,
    isLoading: isSongsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['artist-songs', artistId],
    queryFn: ({ pageParam = 1 }) => musicApi.artists.getSongs(artistId!, pageParam, 50),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.pagination || lastPage?.pagination;
      if (!pagination || !pagination.hasNext) return undefined;
      return pagination.page + 1;
    },
    enabled: !!artistId,
  });

  const artist = artistData?.data;
  const songs = songsData?.pages?.flatMap((page) => page.data?.data || page.data || []) || [];
  const totalTracks = artist?.songCount || songs.length;

  const avatarUrl = getImageUrl(artist?.imageKey || artist?.coverImageKey, { width: 800, height: 800 });
  const bannerUrl = getImageUrl(artist?.bannerImageKey || artist?.bannerKey, { width: 1200, height: 600, crop: 'force' });

  const handlePlayAll = useCallback(() => {
    if (songs.length === 0) return;
    const playerSongs = songs.map(mapToPlayerSong);
    playAll(playerSongs);
  }, [songs, playAll]);

  const MemoizedHeader = useMemo(() => {
    if (!artist) return null;

    return (
      <View>
        <View style={{ height: 500, width: SCREEN_WIDTH }}>
          {bannerUrl || avatarUrl ? (
            <Image
              source={{ uri: bannerUrl || avatarUrl! }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              className="bg-zinc-900"
            />
          )}

          <LinearGradient
            colors={[
              'rgba(0,0,0,0.15)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0.3)',
              'rgba(0,0,0,0.75)',
              'rgba(0,0,0,0.97)',
            ]}
            locations={[0, 0.2, 0.5, 0.78, 1]}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          />

          <View className="absolute bottom-0 left-0 right-0 px-6 pb-7">
            <View className="mb-5 flex-row items-end gap-4">
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 24,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: 'rgba(8,248,8,0.25)',
                  backgroundColor: '#1a1a1a',
                }}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-zinc-800">
                    <Text className="text-3xl font-black text-[#08f808]">
                      {(artist.name || artist.artistName)?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-1 pb-1">
                <View className="mb-1.5 flex-row items-center gap-1.5">
                  <View className="h-4 w-4 items-center justify-center rounded-full bg-[#08f808]">
                    <Ionicons name="checkmark" size={10} color="#000" />
                  </View>
                  <Text className="text-[10px] font-black uppercase tracking-[3px] text-[#08f808]/80">
                    Validated Signal
                  </Text>
                </View>
                <Text
                  className="font-black text-white uppercase"
                  numberOfLines={2}
                  style={{ fontSize: 38, lineHeight: 42, letterSpacing: -1.5 }}>
                  {capitalize(artist.name || artist.artistName)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                <Text className="text-[11px] font-black uppercase tracking-[2px] text-zinc-300">
                  {totalTracks} Signals
                </Text>
              </View>
              {artist.bio && (
                <Text
                  className="flex-1 text-[12px] font-semibold leading-5 text-zinc-400"
                  numberOfLines={2}>
                  {artist.bio}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View className="px-6 py-5">
          <Pressable
            onPress={handlePlayAll}
            style={{
              shadowColor: '#08f808',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            }}
            className="h-14 flex-row items-center justify-center gap-3 rounded-2xl bg-[#08f808] active:opacity-80">
            <Ionicons name="play" size={22} color="#000" style={{ marginLeft: 3 }} />
            <Text
              style={{ letterSpacing: 2 }}
              className="text-[13px] font-black uppercase text-black">
              Sync All
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between px-6 pb-3 pt-1">
          <Text className="text-[22px] font-black tracking-tight text-white">
            Primary Emissions
          </Text>
          <Text className="text-[11px] font-black uppercase tracking-[2px] text-zinc-600">
            {totalTracks} units
          </Text>
        </View>
      </View>
    );
  }, [artist, avatarUrl, bannerUrl, handlePlayAll, totalTracks]);

  if (isArtistLoading || (isSongsLoading && songs.length === 0)) {
    return (
      <View className="flex-1 bg-black">
        <StatusBar style="light" />
        <View style={{ height: 500 }} className="w-full bg-zinc-900/60">
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)', 'black']}
            locations={[0.5, 0.85, 1]}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          />
          <View className="absolute bottom-7 left-6 right-6">
            <View className="mb-5 flex-row items-end gap-4">
              <View className="h-24 w-24 rounded-3xl bg-zinc-800" />
              <View className="flex-1 gap-2 pb-1">
                <View className="h-3 w-24 rounded-full bg-zinc-800" />
                <View className="h-9 w-48 rounded-xl bg-zinc-800" />
              </View>
            </View>
            <View className="h-7 w-28 rounded-full bg-zinc-800" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {(avatarUrl || bannerUrl) && (
        <>
          <Image
            source={{ uri: bannerUrl || avatarUrl! }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              opacity: 0.08,
            }}
            blurRadius={50}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'black']}
            locations={[0, 0.4, 0.8]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </>
      )}

      <Pressable
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          top: insets.top + 12,
          left: 20,
          zIndex: 50,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </Pressable>

      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <SongRow song={mapToPlayerSong(item)} index={index} />}
        ListHeaderComponent={MemoizedHeader}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="items-center py-10">
              <ActivityIndicator color="#08f808" size="small" />
            </View>
          ) : (
            <View className="h-24" />
          )
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}