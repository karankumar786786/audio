import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { musicApi } from '../../lib/api';
import { capitalize } from '../../lib/utils';
import { getImageUrl } from '../../lib/image-utils';
import { LinearGradient } from 'expo-linear-gradient';

export default function UserPlaylists() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const {
    data: playlistsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['userPlaylists'],
    queryFn: () => musicApi.users.getPlaylists(1, 50),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => musicApi.users.createPlaylist(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
      setShowCreate(false);
      setNewTitle('');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create playlist');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => musicApi.users.deletePlaylist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPlaylists'] });
    },
  });

  const playlists = playlistsData?.data?.data || playlistsData?.data || [];
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreate = () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    createMutation.mutate(newTitle.trim());
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Playlist', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const renderPlaylist = ({ item }: { item: any }) => {
    const coverUrl = getImageUrl(item.imageKey || item.coverImageKey, { width: 300, height: 300 });
    return (
      <Pressable
        onPress={() => router.push(`/userplaylist/${item.id}`)}
        className="mx-4 mb-3 flex-row items-center rounded-2xl border border-white/5 bg-zinc-900/40 p-4 active:bg-white/5">
        <View className="mr-4 h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-zinc-800">
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Ionicons name="musical-notes" size={24} color="#08f808" />
          )}
        </View>

        <View className="min-w-0 flex-1">
          <Text className="text-base font-bold text-white" numberOfLines={1}>
            {capitalize(item.name || item.title)}
          </Text>
          <Text className="mt-1 text-xs font-semibold text-zinc-500">
            {item.songCount || item._count?.songs || 0} songs · My Frequency
          </Text>
        </View>

        <Pressable
          onPress={() => handleDelete(item.id, item.name || item.title)}
          className="mr-1 h-9 w-9 items-center justify-center rounded-full active:bg-red-500/10"
          hitSlop={10}>
          <Ionicons name="trash-outline" size={16} color="#71717a" />
        </Pressable>
        <Ionicons name="chevron-forward" size={18} color="#3f3f46" />
      </Pressable>
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

      <View className="flex-row items-center justify-between px-6 pb-2 pt-6">
        <View>
          <Text className="text-3xl font-black tracking-tighter text-white">Your Frequencies</Text>
          <Text className="mt-1 text-sm font-medium text-zinc-500">
            {playlists.length} active nodes
          </Text>
        </View>
      </View>

      <View className="px-4 py-3">
        {showCreate ? (
          <View className="flex-row items-center gap-2">
            <View className="h-12 flex-1 flex-row items-center rounded-2xl border border-white/10 bg-zinc-900 px-4">
              <TextInput
                className="flex-1 text-base text-white"
                placeholder="Frequency name..."
                placeholderTextColor="#52525b"
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
                selectionColor="#08f808"
              />
            </View>
            <Pressable
              onPress={handleCreate}
              disabled={createMutation.isPending}
              className="h-12 w-12 items-center justify-center rounded-xl bg-[#08f808] active:opacity-80">
              {createMutation.isPending ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Ionicons name="checkmark" size={22} color="#000" />
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                setShowCreate(false);
                setNewTitle('');
              }}
              className="h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-zinc-800">
              <Ionicons name="close" size={22} color="#a1a1aa" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowCreate(true)}
            className="h-12 flex-row items-center justify-center rounded-2xl border border-[#08f808]/20 bg-[#08f808]/10 active:bg-[#08f808]/20">
            <Ionicons name="add" size={20} color="#08f808" />
            <Text className="ml-2 font-bold text-[#08f808]">Initialize Frequency</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        renderItem={renderPlaylist}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          isLoading ? (
            <View className="mt-20 items-center">
              <ActivityIndicator color="#08f808" />
            </View>
          ) : (
            <View className="items-center py-20">
              <View className="mb-5 h-24 w-24 items-center justify-center rounded-full border border-white/5 bg-zinc-900/60">
                <Ionicons name="albums-outline" size={40} color="#3f3f46" />
              </View>
              <Text className="text-lg font-bold text-zinc-400">Silence...</Text>
              <Text className="mt-2 px-12 text-center text-sm text-zinc-600">
                Initialize a frequency to start mapping your audio universe.
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#08f808" />
        }
      />
    </SafeAreaView>
  );
}
