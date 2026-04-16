import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AudioSync",
  description: "Your music, everywhere.",
};

import { LeftSidebar } from "@/components/LeftSidebar";
import { AppNavbar } from "@/components/AppNavbar";
import { ShakaMusicPlayer } from "@/components/ShakaMusicPlayer";
import { AuthSync } from "@/components/AuthSync";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex h-screen bg-black text-white selection:bg-indigo-500/30 overflow-hidden">
        <Provider>
          <AuthSync />
          <LeftSidebar />
          <div className="flex-1 flex flex-col min-w-0 ml-64 overflow-hidden relative">
            <AppNavbar />
            <main className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-32">
              {children}
            </main>
          </div>
          <ShakaMusicPlayer />
        </Provider>
      </body>
    </html>
  );
}

