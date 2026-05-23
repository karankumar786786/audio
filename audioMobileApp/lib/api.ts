import { OneMelodyClient } from "@onemelody/api";
import * as SecureStore from "expo-secure-store";

// Re-export all type definitions from @onemelody/api for full backward compatibility
export * from "@onemelody/api";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://172.20.10.3:3000/api/v1";

let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

const getAccessToken = async () => {
  if (!cachedAccessToken) {
    cachedAccessToken = await SecureStore.getItemAsync("system_token");
  }
  return cachedAccessToken;
};

const getRefreshToken = async () => {
  if (!cachedRefreshToken) {
    cachedRefreshToken = await SecureStore.getItemAsync("system_refresh_token");
  }
  return cachedRefreshToken;
};

export const client = new OneMelodyClient({
  baseURL: API_BASE_URL,
  getToken: getAccessToken,
  getRefreshToken: getRefreshToken,
  onTokenRefresh: async (accessToken: string, refreshToken?: string) => {
    cachedAccessToken = accessToken;
    await SecureStore.setItemAsync("system_token", accessToken);
    if (refreshToken) {
      cachedRefreshToken = refreshToken;
      await SecureStore.setItemAsync("system_refresh_token", refreshToken);
    }
  },
  onAuthFailure: async () => {
    cachedAccessToken = null;
    cachedRefreshToken = null;
    await SecureStore.deleteItemAsync("system_token");
    await SecureStore.deleteItemAsync("system_refresh_token");
    await SecureStore.deleteItemAsync("system_user");
  },
});

// Override users.register to handle SecureStore storage for React Native
const originalRegister = client.users.register;
client.users.register = async (accessToken?: string) => {
  const res = await originalRegister(accessToken);
  if (res.success && res.data && res.data.token) {
    cachedAccessToken = res.data.token;
    await SecureStore.setItemAsync("system_token", cachedAccessToken!);
    await SecureStore.setItemAsync("system_user", JSON.stringify(res.data));
  }
  return res;
};

// Backward-compatible exports
export const api = client.api;
export const musicApi = client;
