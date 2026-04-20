import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { musicApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
  const { user: authUser, logout } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: profileData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['me'],
    queryFn: () => musicApi.users.getById(authUser?.id || ''),
    enabled: !!authUser?.id,
  });

  const user = profileData?.data || authUser;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleLogout = () => {
    Alert.alert('Sever Connection', 'Are you sure you want to terminate the sync session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Terminate',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (isLoading && !user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#08f808" size="large" />
      </SafeAreaView>
    );
  }

  const userInitial = (user?.name || user?.email)?.[0]?.toUpperCase() || '?';

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <LinearGradient
        colors={['#1a1a1a', '#050505']}
        className="absolute inset-0"
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#08f808" />
        }>
        
        {/* ── Profile Header ── */}
        <View className="items-center px-8 pb-10 pt-12">
          <View className="relative mb-6 h-36 w-36 items-center justify-center overflow-hidden rounded-[40px] border border-white/[0.1] bg-white/[0.03] shadow-2xl">
            {user?.picture ? (
              <Image source={{ uri: user.picture }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Text className="text-6xl font-black text-[#08f808] opacity-50">{userInitial}</Text>
            )}
            <View className="absolute inset-0 border border-white/[0.05] rounded-[40px]" />
          </View>

          <Text className="text-4xl font-black tracking-tighter text-white uppercase text-center">
            {user?.name || 'Inmate'}
          </Text>
          <View className="mt-3 flex-row items-center rounded-full bg-white/[0.05] border border-white/[0.05] px-4 py-1.5">
            <View className="h-1.5 w-1.5 rounded-full bg-[#08f808] mr-2" />
            <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-[#08f808]">Verified Identity</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View className="mx-6 mb-8 flex-row gap-4">
          <View className="flex-1 rounded-[32px] border border-white/[0.05] bg-white/[0.02] p-6 items-center">
            <Text className="text-2xl font-black text-white">128</Text>
            <Text className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-1">Signals</Text>
          </View>
          <View className="flex-1 rounded-[32px] border border-white/[0.05] bg-white/[0.02] p-6 items-center">
            <Text className="text-2xl font-black text-white">4</Text>
            <Text className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-1">Nodes</Text>
          </View>
        </View>

        {/* ── Menu Cards ── */}
        <View className="px-6 gap-3">
          <View className="rounded-[32px] border border-white/[0.05] bg-white/[0.02] p-6">
            <Text className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700">Digital Identity</Text>
            
            <View className="flex-row items-center justify-between py-3 border-b border-white/[0.03]">
              <Text className="font-bold text-zinc-500">Handle</Text>
              <Text className="font-black text-white">{user?.name || 'N/A'}</Text>
            </View>
            <View className="flex-row items-center justify-between py-3">
              <Text className="font-bold text-zinc-500">Relay</Text>
              <Text className="font-black text-white">{user?.email}</Text>
            </View>
          </View>

          <Pressable onPress={() => router.push('/history')} className="flex-row items-center justify-between rounded-[32px] border border-white/[0.05] bg-white/[0.02] p-6 active:bg-white/[0.05]">
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#08f808]/10 mr-4">
                <Ionicons name="time-outline" size={20} color="#08f808" />
              </View>
              <View>
                <Text className="font-black text-white tracking-tight">Signal Feed</Text>
                <Text className="text-[11px] font-bold text-zinc-600">Track your interference history</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#27272a" />
          </Pressable>

          <Pressable onPress={handleLogout} className="flex-row items-center justify-between rounded-[32px] border border-red-500/10 bg-red-500/[0.02] p-6 active:bg-red-500/10">
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 mr-4">
                <Ionicons name="power-outline" size={20} color="#ef4444" />
              </View>
              <View>
                <Text className="font-black text-red-500 tracking-tight">Terminate Sync</Text>
                <Text className="text-[11px] font-bold text-red-900/40">Securely disconnect identity</Text>
              </View>
            </View>
          </Pressable>
        </View>

        <View className="mt-12 items-center">
          <Text className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-800">Frequency OS v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
