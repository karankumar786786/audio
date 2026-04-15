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
    const sync = async () => {
      if (isAuthenticated && !systemToken && !syncRef.current) {
        syncRef.current = true;
        try {
          console.log("[AuthSync] Initiating system handshake...");
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: `https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/userinfo`,
              scope: "openid profile email",
            }
          });
          
          // 2. Exchange for System JWT
          const response = await musicApi.users.register(token);
          
          if (response.success) {
            console.log("[AuthSync] System synchronization successful.");
            playerActions.setSystemSession(response.data.token, response.data.payload);
            toast.success("Frequency Synchronized", { 
              description: "Secure bridge established with audio-sync core." 
            });
          } else {
            console.error("[AuthSync] Registration failed:", response.message);
            toast.error("Sync Error", { description: response.message });
          }
        } catch (err: any) {
          console.error("[AuthSync] Critical handshake failure:", err);
          toast.error("System Desync", { 
            description: err.message || "Failed to establish secure frequency bridge." 
          });
        } finally {
          syncRef.current = false;
        }
      } else if (!isAuthenticated && systemToken) {
        // Clear session on logout
        playerActions.clearSystemSession();
        syncRef.current = false;
      }
    };

    sync();
  }, [isAuthenticated, systemToken, getAccessTokenSilently, isLoading]);

  return null;
}
