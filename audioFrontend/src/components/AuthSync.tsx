"use client";

import { useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { musicApi } from "@/lib/api";
import { playerActions, playerStore } from "@/store/player.store";
import { useStore } from "@tanstack/react-store";
import { toast } from "sonner";

/**
 * AuthSync Component
 * Bridges Auth0 login and AudioBackend System JWT
 */
export function AuthSync() {
  const { isAuthenticated, getAccessTokenSilently, user, isLoading } = useAuth0();
  const systemToken = useStore(playerStore, (s) => s.systemToken);
  const syncRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    const syncSession = async () => {
      if (isAuthenticated && !systemToken && !syncRef.current) {
        syncRef.current = true;
        try {
          // 1. Get Auth0 Access Token
          const token = await getAccessTokenSilently();
          
          // 2. Exchange for System JWT
          const response = await musicApi.register(token);
          
          if (response.success) {
            playerActions.setSystemSession(response.data.token, response.data.payload);
            toast.success("Frequency Synchronized", {
              description: "Established secure connection with AudioSync Core."
            });
          }
        } catch (err) {
          console.error("Auth Synchronization Failed:", err);
          syncRef.current = false;
          toast.error("Bridge Error", {
            description: "Failed to establish secure frequency. Some features may be restricted."
          });
        }
      } else if (!isAuthenticated && systemToken) {
        // Clear session on logout
        playerActions.clearSystemSession();
        syncRef.current = false;
      }
    };

    syncSession();
  }, [isAuthenticated, systemToken, getAccessTokenSilently, isLoading]);

  return null;
}
