"use client";

import { useStore } from "@tanstack/react-store";
import { playerStore } from "@/store/player.store";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LeftSidebar } from "@/components/LeftSidebar";
import { AppNavbar } from "@/components/AppNavbar";
import { HlsMusicPlayer } from "@/components/HlsMusicPlayer";
import { AuthModal } from "@/components/AuthModal";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !systemUser && pathname !== "/" && pathname !== "/callback") {
      router.replace("/");
    }
  }, [mounted, systemUser, pathname, router]);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-black">
        <div className="animate-pulse text-zinc-500 font-medium text-lg italic">
          Initializing Audio...
        </div>
      </div>
    );
  }

  const isPublicRoute = pathname === "/" || pathname === "/callback";

  // Guest View (Landing Page)
  if (!systemUser) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 overflow-y-auto">
        <AuthModal />
        {isPublicRoute ? children : null}
      </div>
    );
  }

  // Authenticated Full View
  return (
    <>
      <AuthModal />
      <LeftSidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-64 overflow-hidden relative">
        <AppNavbar />
        <main className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-32">
          {children}
        </main>
      </div>
      <HlsMusicPlayer />
    </>
  );
}
