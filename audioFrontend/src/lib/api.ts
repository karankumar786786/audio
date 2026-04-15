import axios from "axios";

/**
 * Global API Client Hub for audioBackend
 * Organized into domain sub-modules for 100% backend parity.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor for System JWT Authentication
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("system_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface Song {
  id: string;
  title: string;
  artistName: string;
  duration: number;
  songKey: string;
  imageKey: string;
  language?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverImageKey?: string;
  bannerImageKey?: string;
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
      return res.data;
    },
    getById: async (id: string) => {
      const res = await api.get(`/users/${id}`);
      return res.data;
    },
    // Favourites
    getFavourites: async (userId: string, page = 1, limit = 50) => {
      const res = await api.get(`/users/${userId}/favourites?page=${page}&limit=${limit}`);
      return res.data;
    },
    addFavourite: async (userId: string, songId: string) => {
      const res = await api.post("/users/favourites", { userId, songId });
      return res.data;
    },
    removeFavourite: async (userId: string, songId: string) => {
      const res = await api.delete("/users/favourites", { data: { userId, songId } });
      return res.data;
    },
    // History
    getHistory: async (userId: string, page = 1, limit = 50) => {
      const res = await api.get(`/users/${userId}/history?page=${page}&limit=${limit}`);
      return res.data;
    },
    // Search History
    getSearchHistory: async (userId: string, page = 1, limit = 20) => {
      const res = await api.get(`/users/${userId}/search-history?page=${page}&limit=${limit}`);
      return res.data;
    },
    saveSearchHistory: async (userId: string, searchedText: string) => {
      const res = await api.post("/users/search-history", { userId, searchedText });
      return res.data;
    },
    clearSearchHistory: async (userId: string) => {
      const res = await api.delete(`/users/${userId}/search-history`);
      return res.data;
    },
    // Personal Playlists
    getPlaylists: async (userId: string, page = 1, limit = 50) => {
      const res = await api.get(`/users/${userId}/playlists?page=${page}&limit=${limit}`);
      return res.data;
    },
    createPlaylist: async (userId: string, name: string) => {
      const res = await api.post("/users/playlists", { userId, name });
      return res.data;
    },
    getPlaylistSongs: async (playlistId: string, page = 1, limit = 50) => {
      const res = await api.get(`/users/playlists/${playlistId}/songs?page=${page}&limit=${limit}`);
      return res.data;
    },
    addSongToPlaylist: async (playlistId: string, songId: string, userId: string) => {
      const res = await api.post("/users/playlists/songs", { playlistId, songId, userId });
      return res.data;
    },
    removeSongFromPlaylist: async (playlistId: string, songId: string, userId: string) => {
      const res = await api.delete("/users/playlists/songs", { data: { playlistId, songId, userId } });
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
      const res = await api.get(`/search?query=${query}`);
      return res.data;
    },
  },

  /** --- INTERACTIONS MODULE --- */
  interactions: {
    recordListen: async (userId: string, songId: string, part = 0) => {
      const res = await api.post("/interactions/listen", { userId, songId, part });
      return res.data;
    },
    getTrending: async () => {
      const res = await api.get("/interactions/trending");
      return res.data;
    },
    getRecommendations: async (userId: string) => {
      const res = await api.get(`/interactions/recommendations/${userId}`);
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
      const res = await api.get(`/artists/${id}/songs?page=${page}&limit=${limit}`);
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
      const res = await api.get(`/playlists/${id}/songs?page=${page}&limit=${limit}`);
      return res.data;
    },
  },
};
