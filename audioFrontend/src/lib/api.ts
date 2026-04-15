import axios from "axios";

/**
 * Global API Client for audioBackend
 * Synchronized with the secured masterRouter paths
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
  // Authentication Bridge
  register: async (accessToken: string): Promise<ApiResponse<{ payload: any; token: string }>> => {
    const res = await api.post("/users/register", { accessToken });
    return res.data;
  },

  // Discovery
  getFeed: async (page = 1, limit = 15): Promise<ApiResponse<PaginatedResult<Song>>> => {
    const res = await api.get(`/songs?page=${page}&limit=${limit}`);
    return res.data;
  },

  // Search (Aligned with backend ?query=)
  search: async (query: string): Promise<ApiResponse<any>> => {
    const res = await api.get(`/search?query=${query}`);
    return res.data;
  },

  // Artists
  getArtists: async (page = 1, limit = 20): Promise<ApiResponse<PaginatedResult<any>>> => {
    const res = await api.get(`/artists?page=${page}&limit=${limit}`);
    return res.data;
  },

  getArtist: async (id: string): Promise<ApiResponse<any>> => {
    const res = await api.get(`/artists/${id}`);
    return res.data;
  },

  getArtistSongs: async (id: string, page = 1, limit = 50): Promise<ApiResponse<PaginatedResult<Song>>> => {
    const res = await api.get(`/artists/${id}/songs?page=${page}&limit=${limit}`);
    return res.data;
  },

  // Playlists
  getPlaylists: async (page = 1, limit = 20): Promise<ApiResponse<PaginatedResult<any>>> => {
    const res = await api.get(`/playlists?page=${page}&limit=${limit}`);
    return res.data;
  },

  getPlaylist: async (id: string): Promise<ApiResponse<any>> => {
    const res = await api.get(`/playlists/${id}`);
    return res.data;
  },

  getPlaylistSongs: async (id: string, page = 1, limit = 50): Promise<ApiResponse<PaginatedResult<Song>>> => {
    const res = await api.get(`/playlists/${id}/songs?page=${page}&limit=${limit}`);
    return res.data;
  },

  // User Specific (History, Favourites, Playlists)
  getUserHistory: async (userId: string, page = 1, limit = 50): Promise<ApiResponse<PaginatedResult<any>>> => {
    const res = await api.get(`/users/${userId}/history?page=${page}&limit=${limit}`);
    return res.data;
  },

  getUserFavourites: async (userId: string, page = 1, limit = 50): Promise<ApiResponse<PaginatedResult<Song>>> => {
    const res = await api.get(`/users/${userId}/favourites?page=${page}&limit=${limit}`);
    return res.data;
  },

  addFavourite: async (userId: string, songId: string): Promise<ApiResponse<any>> => {
    const res = await api.post("/users/favourites", { userId, songId });
    return res.data;
  },

  removeFavourite: async (userId: string, songId: string): Promise<ApiResponse<any>> => {
    const res = await api.delete("/users/favourites", { data: { userId, songId } });
    return res.data;
  },

  // Interaction Tracking
  recordListen: async (userId: string, songId: string, part = 0): Promise<ApiResponse<any>> => {
    const res = await api.post("/interactions/listen", { userId, songId, part });
    return res.data;
  },

  getTrending: async (): Promise<ApiResponse<Song[]>> => {
    const res = await api.get("/interactions/trending");
    return res.data;
  },

  getRecommendations: async (userId: string): Promise<ApiResponse<Song[]>> => {
    const res = await api.get(`/interactions/recommendations/${userId}`);
    return res.data;
  },
};
