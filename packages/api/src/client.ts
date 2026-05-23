import axios, { type AxiosInstance } from "axios";
import type {
  ApiResponse,
  Song,
  HistoryEvent,
  Playlist,
  Artist,
  AdminUser,
  UnifiedSearchResponse,
  PaginatedResult,
  OtpVerifyResponse,
} from "./types";

export interface OneMelodyClientOptions {
  baseURL: string;
  getToken?: () => string | null | Promise<string | null>;
  getRefreshToken?: () => string | null | Promise<string | null>;
  onTokenRefresh?: (accessToken: string, refreshToken?: string) => void | Promise<void>;
  onAuthFailure?: () => void | Promise<void>;
}

export class OneMelodyClient {
  public readonly api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(options: OneMelodyClientOptions) {
    this.api = axios.create({
      baseURL: options.baseURL,
    });

    // Request Interceptor
    this.api.interceptors.request.use(async (config) => {
      if (options.getToken) {
        const token = await options.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Response Interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          options.getRefreshToken
        ) {
          const isAuthRequest = originalRequest.url?.includes("/auth/");
          if (!isAuthRequest) {
            const refreshToken = await options.getRefreshToken();
            if (refreshToken) {
              if (this.isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                  this.failedQueue.push({ resolve, reject });
                })
                  .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return this.api(originalRequest);
                  })
                  .catch((err) => Promise.reject(err));
              }

              originalRequest._retry = true;
              this.isRefreshing = true;

              try {
                const res = await axios.post(`${options.baseURL}/auth/refresh-token`, {
                  refreshToken,
                });
                const { accessToken, refreshToken: newRefreshToken } = res.data.data;

                if (options.onTokenRefresh) {
                  await options.onTokenRefresh(accessToken, newRefreshToken);
                }

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                this.processQueue(null, accessToken);
                return this.api(originalRequest);
              } catch (refreshError) {
                this.processQueue(refreshError, null);
                if (options.onAuthFailure) {
                  await options.onAuthFailure();
                }
                return Promise.reject(refreshError);
              } finally {
                this.isRefreshing = false;
              }
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (token) {
        prom.resolve(token);
      } else {
        prom.reject(error);
      }
    });
    this.failedQueue = [];
  }

  /** --- AUTH MODULE --- */
  public readonly auth = {
    register: async (name: string, email: string) => {
      const res = await this.api.post<ApiResponse<{ token: string }>>("/auth/register", { name, email });
      return res.data;
    },
    login: async (email: string) => {
      const res = await this.api.post<ApiResponse<{ token: string }>>("/auth/login", { email });
      return res.data;
    },
    resendOtp: async (token: string, email?: string) => {
      const res = await this.api.post<ApiResponse<{ token: string }>>("/auth/resend-otp", { token, email });
      return res.data;
    },
    verifyOtp: async (token: string, otp: string, email?: string) => {
      const res = await this.api.post<ApiResponse<OtpVerifyResponse>>("/auth/verify-otp", { token, otp, email });
      return res.data;
    },
    refreshToken: async (refreshToken: string) => {
      const res = await this.api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>("/auth/refresh-token", { refreshToken });
      return res.data;
    },
  };

  /** --- USERS MODULE --- */
  public readonly users = {
    register: async (accessToken?: string) => {
      const res = await this.api.post<ApiResponse<any>>("/users/register", { accessToken });
      return res.data;
    },
    getById: async (id: string) => {
      const res = await this.api.get<ApiResponse<any>>(`/users/${id}`);
      return res.data;
    },
    getFavourites: async (page = 1, limit = 50) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<Song>>>(`/users/favourites?page=${page}&limit=${limit}`);
      return res.data;
    },
    addFavourite: async (songId: string) => {
      const res = await this.api.post<ApiResponse<any>>("/users/favourites", { songId });
      return res.data;
    },
    removeFavourite: async (songId: string) => {
      const res = await this.api.delete<ApiResponse<any>>("/users/favourites", { data: { songId } });
      return res.data;
    },
    getHistory: async (page = 1, limit = 50) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<HistoryEvent>>>(`/users/history?page=${page}&limit=${limit}`);
      return res.data;
    },
    getSearchHistory: async (page = 1, limit = 20) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<{ id: string; searchedText: string; searchedAt: string }>>>(`/users/search-history?page=${page}&limit=${limit}`);
      return res.data;
    },
    saveSearchHistory: async (searchedText: string) => {
      const res = await this.api.post<ApiResponse<any>>("/users/search-history", { searchedText });
      return res.data;
    },
    clearSearchHistory: async () => {
      const res = await this.api.delete<ApiResponse<any>>("/users/search-history");
      return res.data;
    },
    getPlaylists: async (page = 1, limit = 50) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<Playlist>>>(`/users/playlists?page=${page}&limit=${limit}`);
      return res.data;
    },
    createPlaylist: async (name: string) => {
      const res = await this.api.post<ApiResponse<Playlist>>("/users/playlists", { name });
      return res.data;
    },
    getPlaylistById: async (playlistId: string) => {
      const res = await this.api.get<ApiResponse<Playlist>>(`/users/playlists/${playlistId}`);
      return res.data;
    },
    getPlaylistSongs: async (playlistId: string, page = 1, limit = 50) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<Song>>>(`/users/playlists/${playlistId}/songs?page=${page}&limit=${limit}`);
      return res.data;
    },
    addSongToPlaylist: async (playlistId: string, songId: string) => {
      const res = await this.api.post<ApiResponse<any>>("/users/playlists/songs", { playlistId, songId });
      return res.data;
    },
    removeSongFromPlaylist: async (playlistId: string, songId: string) => {
      const res = await this.api.delete<ApiResponse<any>>("/users/playlists/songs", { data: { playlistId, songId } });
      return res.data;
    },
    deletePlaylist: async (playlistId: string) => {
      const res = await this.api.delete<ApiResponse<any>>(`/users/playlists/${playlistId}`);
      return res.data;
    },
    // Admin list of users
    list: async (page = 1, limit = 50) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<any>>>(`/users?page=${page}&limit=${limit}`);
      return res.data;
    },
    // Admin list of administrators
    listAdmins: async (page = 1, limit = 50) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<AdminUser>>>(`/users/admins?page=${page}&limit=${limit}`);
      return res.data;
    },
    createAdmin: async (name: string, email: string) => {
      const res = await this.api.post<ApiResponse<AdminUser>>("/users/admins", { name, email });
      return res.data;
    },
    deleteAdmin: async (id: string) => {
      const res = await this.api.delete<ApiResponse<any>>(`/users/admins/${id}`);
      return res.data;
    },
  };

  /** --- SONGS MODULE --- */
  public readonly songs = {
    getFeed: async (page = 1, limit = 15) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<Song>>>(`/songs?page=${page}&limit=${limit}`);
      return res.data;
    },
    getById: async (id: string) => {
      const res = await this.api.get<ApiResponse<Song>>(`/songs/${id}`);
      return res.data;
    },
    create: async (data: { title: string; artistName: string; tempSongKey: string; imageKey: string }) => {
      const res = await this.api.post<ApiResponse<any>>("/songs", data);
      return res.data;
    },
    createFromYoutube: async (data: { ytUrl: string; title: string; artistName: string }) => {
      const res = await this.api.post<ApiResponse<any>>("/songs/youtube", data);
      return res.data;
    },
    delete: async (id: string) => {
      const res = await this.api.delete<ApiResponse<any>>(`/songs/${id}`);
      return res.data;
    },
  };

  /** --- SEARCH MODULE --- */
  public readonly search = {
    unified: async (query: string) => {
      const res = await this.api.get<ApiResponse<UnifiedSearchResponse>>(`/search?q=${encodeURIComponent(query)}`);
      return res.data;
    },
  };

  /** --- INTERACTIONS MODULE --- */
  public readonly interactions = {
    recordListen: async (songId: string, part = 0) => {
      const res = await this.api.post<ApiResponse<any>>("/interactions/listen", { songId, part });
      return res.data;
    },
    getTrending: async (page = 1, limit = 20) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<Song>>>(`/interactions/trending?page=${page}&limit=${limit}`);
      return res.data;
    },
    getRecommendations: async (limit = 10) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<Song>>>(`/interactions/recommendations?limit=${limit}`);
      return res.data;
    },
  };

  /** --- ARTISTS MODULE --- */
  public readonly artists = {
    list: async (page = 1, limit = 20) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<Artist>>>(`/artists?page=${page}&limit=${limit}`);
      return res.data;
    },
    getById: async (id: string) => {
      const res = await this.api.get<ApiResponse<Artist>>(`/artists/${id}`);
      return res.data;
    },
    getSongs: async (id: string, page = 1, limit = 50) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<Song>>>(`/artists/${id}/songs?page=${page}&limit=${limit}`);
      return res.data;
    },
    create: async (data: { name: string; about?: string; dob?: string; coverImageKey?: string; bannerImageKey?: string }) => {
      const res = await this.api.post<ApiResponse<Artist>>("/artists", data);
      return res.data;
    },
    delete: async (id: string) => {
      const res = await this.api.delete<ApiResponse<Artist>>(`/artists/${id}`);
      return res.data;
    },
  };

  /** --- SYSTEM PLAYLISTS MODULE --- */
  public readonly playlists = {
    list: async (page = 1, limit = 20) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<Playlist>>>(`/playlists?page=${page}&limit=${limit}`);
      return res.data;
    },
    getById: async (id: string) => {
      const res = await this.api.get<ApiResponse<Playlist>>(`/playlists/${id}`);
      return res.data;
    },
    getSongs: async (id: string, page = 1, limit = 50) => {
      const res = await this.api.get<ApiResponse<PaginatedResult<Song>>>(`/playlists/${id}/songs?page=${page}&limit=${limit}`);
      return res.data;
    },
    create: async (data: { name: string; description?: string; coverImageKey?: string; bannerImageKey?: string }) => {
      const res = await this.api.post<ApiResponse<Playlist>>("/playlists", data);
      return res.data;
    },
    addSong: async (playlistId: string, songId: string) => {
      const res = await this.api.post<ApiResponse<any>>("/playlists/songs", { playlistId, songId });
      return res.data;
    },
    removeSong: async (playlistId: string, songId: string) => {
      const res = await this.api.delete<ApiResponse<any>>("/playlists/songs", { data: { playlistId, songId } });
      return res.data;
    },
    delete: async (id: string) => {
      const res = await this.api.delete<ApiResponse<Playlist>>(`/playlists/${id}`);
      return res.data;
    },
  };

  /** --- MISC MODULE --- */
  public readonly misc = {
    getPresignedSongUrl: async () => {
      const res = await this.api.get<ApiResponse<{ url: string; key: string }>>("/misc/presigned-url/song");
      return res.data;
    },
    getPresignedImageUrl: async () => {
      const res = await this.api.get<ApiResponse<{ url: string; key: string }>>("/misc/presigned-url/image");
      return res.data;
    },
    getYtInfo: async (url: string) => {
      const res = await this.api.get<ApiResponse<{ title: string; artistName: string; duration: number }>>(`/misc/yt-info?url=${encodeURIComponent(url)}`);
      return res.data;
    },
  };
}
