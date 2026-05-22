export interface Song {
  id: string;
  title: string;
  artistName: string;
  duration: number;
  songKey: string;
  imageKey: string;
  language?: string;
  createdAt?: string;
}

export interface HistoryEvent extends Song {
  historyId: string;
  listenedAt: string;
  part: number;
}

export interface Playlist {
  id: string;
  name: string;
  title?: string;
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

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin" | "superadmin";
}

export interface UnifiedSearchResponse {
  songs: Song[];
  artists: Artist[];
  playlists: Playlist[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface OtpVerifyResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "user" | "admin" | "superadmin";
  };
}
