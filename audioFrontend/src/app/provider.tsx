"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import React from 'react';
import { Toaster } from "sonner";

function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
      authorizationParams={{
        redirect_uri: typeof window !== "undefined" ? window.location.origin + "/callback" : "",
        scope: "openid profile email",
        audience: `https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/userinfo`,
      }}
      cacheLocation="localstorage"
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster 
          theme="dark" 
          position="bottom-left" 
          richColors 
          toastOptions={{
            style: {
              background: "#18181b",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
            },
          }}
        />
      </QueryClientProvider>
    </Auth0Provider>
  );
}

export default Provider;