const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4444/api/v1";

export interface Song {
  id: string;
  title: string;
  artistName: string;
  duration: number;
  songKey: string;
  imageKey: string;
  language: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
    };
  };
}

export const api = {
  songs: {
    list: async (page = 1, limit = 20, query?: string): Promise<PaginatedResponse<Song>> => {
      const url = new URL(`${API_URL}/songs`);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());
      if (query) url.searchParams.set("q", query);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch songs");
      return res.json();
    },
    
    getById: async (id: string): Promise<{ data: Song }> => {
      const res = await fetch(`${API_URL}/songs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch song");
      return res.json();
    }
  },
  
  playlists: {
    list: async (): Promise<any> => {
      const res = await fetch(`${API_URL}/playlists`);
      if (!res.ok) throw new Error("Failed to fetch playlists");
      return res.json();
    }
  }
};
