import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { musicApi } from '../../lib/api';
import { getImageUrl } from '../../lib/image-utils';
import { capitalize } from '../../lib/utils';
import SongRow from '../../components/SongRow';
import { LinearGradient } from 'expo-linear-gradient';

const mapToPlayerSong = (s: any) => ({
  id: s.id,
  title: s.title,
  artistName: s.artistName,
  songKey: s.songKey,
  imageKey: s.imageKey,
  coverUrl: getImageUrl(s.imageKey, { width: 400, height: 400, crop: 'at_max' }) || null,
});

export default function SearchTab() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      return () => {
        Keyboard.dismiss();
        inputRef.current?.blur();
      };
    }, [])
  );

  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery('');
      setIsDebouncing(false);
      return;
    }
    setIsDebouncing(true);
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setIsDebouncing(false);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  const {
    data: searchData,
    isLoading: isInitialLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => musicApi.search.unified(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 30000,
    retry: 1,
  });

  const isPending = isFetching || isDebouncing;

  const { data: historyData } = useQuery({
    queryKey: ['searchHistory'],
    queryFn: () => musicApi.users.getSearchHistory(1, 20),
  });

  const saveHistoryMutation = useMutation({
    mutationFn: (text: string) => musicApi.users.saveSearchHistory(text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    },
  });

  const results = searchData?.data;
  const hasSongs = (results?.songs?.length ?? 0) > 0;
  const hasArtists = (results?.artists?.length ?? 0) > 0;
  const hasPlaylists = (results?.playlists?.length ?? 0) > 0;
  const hasResults = hasSongs || hasArtists || hasPlaylists;

  const searchHistory = historyData?.data?.data || historyData?.data || [];
  const showHistory = !query && searchHistory.length > 0;

  const handleSaveHistory = useCallback(
    (text: string) => {
      const exists = searchHistory.some(
        (item: any) => (item.searchedText || item.searchString || '').toLowerCase() === text.toLowerCase()
      );
      if (!exists) {
        saveHistoryMutation.mutate(text);
      }
    },
    [searchHistory, saveHistoryMutation]
  );

  const MemoizedResults = useMemo(() => {
    if (debouncedQuery.trim().length === 0 || !hasResults) return null;

    return (
      <View className="gap-10 pb-20">
        {/* Songs */}
        {hasSongs && (
          <View>
            <View className="mb-4 px-6">
              <Text className="text-2xl font-black tracking-tight text-white">Songs</Text>
            </View>
            <View className="px-2">
              {results.songs.map((song: any, index: number) => (
                <SongRow
                  key={song.id}
                  song={mapToPlayerSong(song)}
                  index={index}
                  onPress={() => {
                    handleSaveHistory(song.title);
                    Keyboard.dismiss();
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Artists */}
        {hasArtists && (
          <View>
            <Text className="mb-4 px-6 text-2xl font-black tracking-tight text-white">
              Artists
            </Text>
            <View className="px-2">
              {results.artists.map((artist: any) => {
                const avatarUrl = getImageUrl(artist.imageKey || artist.coverImageKey, { width: 200, height: 200, crop: 'at_max' });
                return (
                  <Pressable
                    key={artist.id}
                    onPress={() => {
                      handleSaveHistory(artist.name || artist.artistName);
                      Keyboard.dismiss();
                      router.push(`/artist/${artist.id}`);
                    }}
                    className="flex-row items-center gap-4 rounded-3xl px-4 py-3 active:bg-white/10">
                    <View className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-zinc-900 shadow-2xl">
                      {avatarUrl ? (
                        <Image
                          source={{ uri: avatarUrl }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center bg-zinc-800">
                          <Text className="text-xl font-black text-white/20">
                            {(artist.name || artist.artistName)?.[0]?.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-[17px] font-black tracking-tight text-white"
                        numberOfLines={1}>
                        {capitalize(artist.name || artist.artistName)}
                      </Text>
                      <Text className="mt-0.5 text-[11px] font-black uppercase tracking-[0.15em] text-zinc-500">
                        Artist
                      </Text>
                    </View>
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-white/5">
                      <Ionicons name="chevron-forward" size={18} color="#52525b" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Playlists */}
        {hasPlaylists && (
          <View>
            <Text className="mb-4 px-6 text-2xl font-black tracking-tight text-white">
              Playlists
            </Text>
            <View className="px-2">
              {results.playlists.map((playlist: any) => {
                const coverUrl = getImageUrl(playlist.imageKey || playlist.coverImageKey, { width: 200, height: 200 });
                return (
                  <Pressable
                    key={playlist.id}
                    onPress={() => {
                      handleSaveHistory(playlist.name || playlist.title);
                      Keyboard.dismiss();
                      router.push(`/playlist/${playlist.id}`);
                    }}
                    className="flex-row items-center gap-4 rounded-3xl px-4 py-3 active:bg-white/10">
                    <View className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
                      {coverUrl ? (
                        <Image
                          source={{ uri: coverUrl }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="h-full w-full items-center justify-center bg-zinc-800">
                          <Ionicons name="musical-notes-outline" size={24} color="#3f3f46" />
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-[17px] font-black tracking-tight text-white"
                        numberOfLines={1}>
                        {capitalize(playlist.name || playlist.title)}
                      </Text>
                      <Text
                        className="mt-0.5 text-[13px] font-medium text-zinc-500"
                        numberOfLines={1}>
                        {playlist.description || 'Curated Playlist'}
                      </Text>
                    </View>
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-white/5">
                      <Ionicons name="chevron-forward" size={18} color="#52525b" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  }, [
    debouncedQuery,
    hasResults,
    hasSongs,
    hasArtists,
    hasPlaylists,
    results,
    handleSaveHistory,
  ]);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <LinearGradient
        colors={['#1a1a1a', '#050505']}
        className="absolute inset-0"
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      />

      <View className="flex-row items-center gap-3 px-6 pb-2 pt-6">
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text className="text-4xl font-black tracking-tighter text-white">Frequency Search</Text>
      </View>

      <View className="px-6 py-4">
        <View
          style={{ overflow: 'hidden' }}
          className="h-16 flex-row items-center rounded-3xl border border-white/10 bg-white/10 px-6 shadow-2xl">
          <Ionicons name="search" size={22} color="#71717a" />
          <TextInput
            ref={inputRef}
            className="ml-4 flex-1 text-[18px] font-bold text-white"
            placeholder="Signals, frequencies, or patterns..."
            placeholderTextColor="#52525b"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            selectionColor="#08f808"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            onSubmitEditing={() => {
              const trimmed = query.trim();
              if (trimmed.length > 0) handleSaveHistory(trimmed);
            }}
          />
          {isPending && (
            <View className="mr-2">
              <ActivityIndicator color="#08f808" size="small" />
            </View>
          )}
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={15}
              className="h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <Ionicons name="close" size={18} color="#a1a1aa" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>

        {showHistory && (
          <View className="px-6 pb-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                Recent Frequencies
              </Text>
            </View>
            <View className="gap-1">
              {searchHistory.slice(0, 10).map((item: any, index: number) => {
                const text = item.searchedText || item.searchString;
                return (
                  <Pressable
                    key={item.id || index}
                    onPress={() => {
                      setQuery(text);
                      setDebouncedQuery(text);
                      setIsDebouncing(false);
                    }}
                    className="flex-row items-center gap-4 rounded-2xl py-3 active:bg-white/10">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-zinc-900/50">
                      <Ionicons name="time-outline" size={18} color="#71717a" />
                    </View>
                    <Text
                      className="flex-1 text-[16px] font-semibold text-zinc-300"
                      numberOfLines={1}>
                      {text}
                    </Text>
                    <Ionicons
                      name="arrow-up-outline"
                      size={16}
                      color="#3f3f46"
                      style={{ transform: [{ rotate: '-45deg' }] }}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {!query && !showHistory && (
          <View className="items-center py-20">
            <Ionicons name="search" size={48} color="#3f3f46" />
            <Text className="mt-4 text-base text-zinc-500">
              Scan for songs, artists, or playlists
            </Text>
          </View>
        )}

        {debouncedQuery.trim().length > 0 && isInitialLoading && !hasResults && (
          <View className="items-center py-20">
            <ActivityIndicator color="#08f808" size="large" />
            <Text className="mt-4 text-xs font-black uppercase tracking-widest text-zinc-600">
              Filtering...
            </Text>
          </View>
        )}

        {debouncedQuery.trim().length > 0 &&
          !isPending &&
          !isInitialLoading &&
          !hasResults && (
            <View className="items-center py-20">
              <Ionicons name="sad-outline" size={48} color="#3f3f46" />
              <Text className="mt-4 text-base text-zinc-500">
                No signals found for &quot;{debouncedQuery}&quot;
              </Text>
            </View>
          )}

        {MemoizedResults}
      </ScrollView>
    </SafeAreaView>
  );
}