import axios from "axios";

/**
 * Global API Client Hub for audioBackend
 * Organized into domain sub-modules for 100% backend parity.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

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

// Response Interceptor for Session Auto-Healing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      const refreshToken = localStorage.getItem("system_refresh_token");
      const isAuthRequest = originalRequest.url.includes("/auth/");

      if (refreshToken && !isAuthRequest) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });
          const { accessToken } = res.data.data;
          localStorage.setItem("system_token", accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          processQueue(null, accessToken);
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          console.warn("[API] Token refresh failed. Purging session.");
          localStorage.removeItem("system_token");
          localStorage.removeItem("system_refresh_token");
          localStorage.removeItem("system_user");
          window.location.reload();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem("system_token");
        localStorage.removeItem("system_refresh_token");
        localStorage.removeItem("system_user");
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
  /** --- AUTH MODULE --- */
  auth: {
    register: async (name: string, email: string) => {
      const res = await api.post("/auth/register", { name, email });
      return res.data;
    },
    login: async (email: string) => {
      const res = await api.post("/auth/login", { email });
      return res.data;
    },
    resendOtp: async (token: string) => {
      const res = await api.post("/auth/resend-otp", { token });
      return res.data;
    },
    verifyOtp: async (token: string, otp: string) => {
      const res = await api.post("/auth/verify-otp", { token, otp });
      return res.data;
    },
    refreshToken: async (refreshToken: string) => {
      const res = await api.post("/auth/refresh-token", { refreshToken });
      return res.data;
    },
  },

  /** --- USERS MODULE --- */
  users: {
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
    getTrending: async (page = 1, limit = 20) => {
      const res = await api.get(`/interactions/trending?page=${page}&limit=${limit}`);
      return res.data;
    },
    getRecommendations: async (limit = 10) => {
      const res = await api.get(`/interactions/recommendations?limit=${limit}`);
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
