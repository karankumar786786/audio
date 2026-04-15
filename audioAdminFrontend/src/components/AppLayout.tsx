"use client";

import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="text-sm font-medium text-zinc-500">
            Welcome back, <span className="text-zinc-900 dark:text-white">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2" />
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <span className="text-sm font-medium text-zinc-900 dark:text-white">Music Corp</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                M
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 relative overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
