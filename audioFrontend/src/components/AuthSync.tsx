"use client";

import { useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { musicApi } from "@/lib/api";
import { playerActions, playerStore } from "@/store/player.store";
import { useStore } from "@tanstack/react-store";
import { toast } from "sonner";

/**
 * AuthSync Component
 * Bridges Auth0 login and AudioBackend System JWT.
 * Also restores systemUser from localStorage on page reload.
 */
export function AuthSync() {
  const { isAuthenticated, getAccessTokenSilently, user, isLoading } = useAuth0();
  const systemToken = useStore(playerStore, (s) => s.systemToken);
  const systemUser = useStore(playerStore, (s) => s.systemUser);
  const syncRef = useRef(false);

  // Restore systemUser from localStorage on mount (survives page reload)
  useEffect(() => {
    if (systemToken && !systemUser) {
      try {
        const saved = localStorage.getItem("system_user");
        if (saved) {
          const parsed = JSON.parse(saved);
          playerStore.setState((s) => ({ ...s, systemUser: parsed }));
          playerActions.fetchFavourites();
        }
      } catch (e) {
        console.error("[AuthSync] Failed to restore systemUser from localStorage:", e);
      }
    }
  }, [systemToken, systemUser]);

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
            
            // Extract token from response body (backend now always includes it)
            const systemJwt = response.data.token;
            
            // Extract payload — the token field is mixed in with the payload fields
            const { token: _t, ...payload } = response.data;
            
            // Persist systemUser to localStorage for page reload survival
            localStorage.setItem("system_user", JSON.stringify(payload));
            
            playerActions.setSystemSession(systemJwt, payload);
            playerActions.fetchFavourites();
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
        localStorage.removeItem("system_user");
        playerActions.clearSystemSession();
        syncRef.current = false;
      }
    };

    sync();
  }, [isAuthenticated, systemToken, getAccessTokenSilently, isLoading]);

  return null;
}
