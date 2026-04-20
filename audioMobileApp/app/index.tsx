import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthScreen() {
  const { loginWithAuth0, isLoading } = useAuth();

  const handleAuth = async () => {
    try {
      await loginWithAuth0('AUTH0_ACCESS_TOKEN_PLACEHOLDER');
    } catch (error) {
      // Errors are handled inside loginWithAuth0 toasts/logs
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a1a1a', '#050505']}
        className="absolute inset-0"
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      />
      
      <View className="flex-1 px-8 justify-center">
        {/* Logo / Branding */}
        <View className="mb-12 items-center">
          <View className="mb-8 h-32 w-32 items-center justify-center rounded-[40px] bg-white/[0.03] shadow-2xl border border-white/[0.05]">
            <Ionicons name="infinite" size={64} color="#08f808" />
          </View>
          <Text className="text-6xl font-black tracking-tighter text-white">Frequency</Text>
          <Text className="mt-4 text-center text-[16px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
            Harmonizing the Digital Void
          </Text>
        </View>

        {/* Action Card */}
        <View className="overflow-hidden rounded-[48px] border border-white/[0.08] bg-white/[0.02] p-10 shadow-2xl">
          <Text className="mb-10 text-center text-[15px] font-medium leading-6 text-zinc-400">
            Synchronize your identity to enter the curated audio dimension. 
            Powered by high-fidelity neural streaming.
          </Text>

          <Pressable
            onPress={handleAuth}
            disabled={isLoading}
            style={{
              shadowColor: '#08f808',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            }}
            className="h-16 flex-row items-center justify-center rounded-[24px] bg-[#08f808] active:scale-[0.98] active:opacity-90">
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text className="text-lg font-black tracking-tight text-black uppercase">
                  Initialize Sync
                </Text>
                <Ionicons name="pulse" size={20} color="#000" style={{ marginLeft: 10 }} />
              </>
            )}
          </Pressable>

          <View className="mt-8 items-center">
            <Text className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-700">
              Auth0 Secured Handshake
            </Text>
          </View>
        </View>

        <Text className="mt-12 text-center text-[12px] font-bold text-zinc-800">
          v1.0.0-beta // Core Parity Established
        </Text>
      </View>
    </SafeAreaView>
  );
}
