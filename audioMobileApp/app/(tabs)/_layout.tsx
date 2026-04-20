import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import MiniPlayer from '../../components/MiniPlayer';
import { musicApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function TabLayout() {
  const { user } = useAuth();

  useQuery({
    queryKey: ['userPlaylists'],
    queryFn: () => musicApi.users.getPlaylists(1, 10),
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  useQuery({
    queryKey: ['me'],
    queryFn: () => musicApi.users.getById(user?.id || ''),
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id,
  });

  return (
    <View className="flex-1 bg-black">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#050505',
            borderTopColor: '#121212',
            borderTopWidth: 1,
            height: 90,
            paddingBottom: 30,
            paddingTop: 10,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: '#08f808',
          tabBarInactiveTintColor: '#52525b',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 0.2,
          },
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="userPlaylists"
          options={{
            title: 'Frequencies',
            tabBarIcon: ({ color, size }) => <Ionicons name="radio-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="favourites"
          options={{
            title: 'Synced',
            tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Identity',
            tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
          }}
        />
      </Tabs>
      <View className="absolute bottom-24 left-0 right-0">
        <MiniPlayer />
      </View>
    </View>
  );
}