"use client";

import { useEffect, useState } from "react";

interface Song {
  id: string;
  title: string;
  artistName: string;
  duration: number;
  language: string;
}

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/songs`);
        const result = await response.json();
        
        if (result.success) {
          setSongs(result.data.items);
        } else {
          setError(result.message || "Failed to fetch songs");
        }
      } catch (err) {
        setError("Error connecting to the backend");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Manage your music library and artists.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-2xl font-bold">{songs.length}</span>
              <span className="text-xs uppercase tracking-wider text-zinc-500">Total Songs</span>
            </div>
          </div>
        </header>

        <main>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900 dark:border-white"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Title</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Artist</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Language</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {songs.length > 0 ? (
                    songs.map((song) => (
                      <tr key={song.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{song.title}</td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{song.artistName}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                            {song.language}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-500">
                          {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-zinc-500">
                        No songs found in the library.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
