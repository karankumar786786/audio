import axios from "axios";
import * as SecureStore from "expo-secure-store";

/**
 * Global API Client Hub for audioBackend
 * Organized into domain sub-modules for 100% backend parity.
 */

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

let cachedToken: string | null = null;

// Interceptor for System JWT Authentication (using SecureStore for mobile)
api.interceptors.request.use(async (config) => {
  if (!cachedToken) {
    cachedToken = await SecureStore.getItemAsync("system_token");
  }
  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }
  return config;
});

// Response Interceptor for Session Auto-Healing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response ? error.response.status : null;
    if (status === 401) {
      // Only purge session if it's a critical auth-required endpoint,
      // not background interactions which might fail due to stale tokens/timing.
      const isBackgroundRequest = error.config.url.includes("/interactions/");
      if (!isBackgroundRequest) {
        console.warn(
          "[API] Security interceptor triggered (401). Purging stale session.",
        );
        cachedToken = null;
        await SecureStore.deleteItemAsync("system_token");
        await SecureStore.deleteItemAsync("system_user");
      }
    }
    return Promise.reject(error);
  },
);

export interface Song {
  id: string;
  title: string;
  artistName: string;
  duration: number;
  songKey: string;
  imageKey: string;
  language?: string;
}

export interface HistoryEvent extends Song {
  historyId: string;
  listenedAt: string;
  part: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverImageKey?: string;
  bannerImageKey?: string;
}

export interface Artist {
  id: string;
  name: string;
  about?: string;
  dob?: string;
  coverImageKey?: string;
  bannerImageKey?: string;
}

export interface UnifiedSearchResponse {
  songs: Song[];
  artists: Artist[];
  playlists: Playlist[];
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const musicApi = {
  /** --- USERS MODULE --- */
  users: {
    register: async (accessToken: string) => {
      const res = await api.post("/users/register", { accessToken });
      if (res.data.success && res.data.data.token) {
        cachedToken = res.data.data.token;
        await SecureStore.setItemAsync("system_token", cachedToken!);
        await SecureStore.setItemAsync("system_user", JSON.stringify(res.data.data));
      }
      return res.data;
    },
    getById: async (id: string) => {
      const res = await api.get(`/users/${id}`);
      return res.data;
    },
    // Favourites
    getFavourites: async (page = 1, limit = 50) => {
      const res = await api.get(
        `/users/favourites?page=${page}&limit=${limit}`,
      );
      return res.data;
    },
    addFavourite: async (songId: string) => {
      const res = await api.post("/users/favourites", { songId });
      return res.data;
    },
    removeFavourite: async (songId: string) => {
      const res = await api.delete("/users/favourites", {
        data: { songId },
      });
      return res.data;
    },
    // History
    getHistory: async (page = 1, limit = 50) => {
      const res = await api.get(
        `/users/history?page=${page}&limit=${limit}`,
      );
      return res.data;
    },
    // Search History
    getSearchHistory: async (page = 1, limit = 20) => {
      const res = await api.get(
        `/users/search-history?page=${page}&limit=${limit}`,
      );
      return res.data;
    },
    saveSearchHistory: async (searchedText: string) => {
      const res = await api.post("/users/search-history", {
        searchedText,
      });
      return res.data;
    },
    clearSearchHistory: async () => {
      const res = await api.delete(`/users/search-history`);
      return res.data;
    },
    // Personal Playlists
    getPlaylists: async (page = 1, limit = 50) => {
      const res = await api.get(
        `/users/playlists?page=${page}&limit=${limit}`,
      );
      return res.data;
    },
    createPlaylist: async (name: string) => {
      const res = await api.post("/users/playlists", { name });
      return res.data;
    },
    getPlaylistById: async (playlistId: string) => {
      const res = await api.get(`/users/playlists/${playlistId}`);
      return res.data;
    },
    getPlaylistSongs: async (playlistId: string, page = 1, limit = 50) => {
      const res = await api.get(
        `/users/playlists/${playlistId}/songs?page=${page}&limit=${limit}`,
      );
      return res.data;
    },
    addSongToPlaylist: async (
      playlistId: string,
      songId: string,
    ) => {
      const res = await api.post("/users/playlists/songs", {
        playlistId,
        songId,
      });
      return res.data;
    },
    removeSongFromPlaylist: async (
      playlistId: string,
      songId: string,
    ) => {
      const res = await api.delete("/users/playlists/songs", {
        data: { playlistId, songId },
      });
      return res.data;
    },
    deletePlaylist: async (playlistId: string) => {
      const res = await api.delete(`/users/playlists/${playlistId}`);
      return res.data;
    },
  },

  /** --- SONGS MODULE --- */
  songs: {
    getFeed: async (page = 1, limit = 15) => {
      const res = await api.get(`/songs?page=${page}&limit=${limit}`);
      return res.data;
    },
    getById: async (id: string) => {
      const res = await api.get(`/songs/${id}`);
      return res.data;
    },
  },

  /** --- SEARCH MODULE --- */
  search: {
    unified: async (query: string) => {
      const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
      return res.data;
    },
  },

  /** --- INTERACTIONS MODULE --- */
  interactions: {
    recordListen: async (songId: string, part = 0) => {
      const res = await api.post("/interactions/listen", {
        songId,
        part,
      });
      return res.data;
    },
    getTrending: async () => {
      const res = await api.get("/interactions/trending");
      return res.data;
    },
    getRecommendations: async () => {
      const res = await api.get(`/interactions/recommendations`);
      return res.data;
    },
  },

  /** --- ARTISTS MODULE --- */
  artists: {
    list: async (page = 1, limit = 20) => {
      const res = await api.get(`/artists?page=${page}&limit=${limit}`);
      return res.data;
    },
    getById: async (id: string) => {
      const res = await api.get(`/artists/${id}`);
      return res.data;
    },
    getSongs: async (id: string, page = 1, limit = 50) => {
      const res = await api.get(
        `/artists/${id}/songs?page=${page}&limit=${limit}`,
      );
      return res.data;
    },
  },

  /** --- SYSTEM PLAYLISTS MODULE --- */
  playlists: {
    list: async (page = 1, limit = 20) => {
      const res = await api.get(`/playlists?page=${page}&limit=${limit}`);
      return res.data;
    },
    getById: async (id: string) => {
      const res = await api.get(`/playlists/${id}`);
      return res.data;
    },
    getSongs: async (id: string, page = 1, limit = 50) => {
      const res = await api.get(
        `/playlists/${id}/songs?page=${page}&limit=${limit}`,
      );
      return res.data;
    },
  },
};
