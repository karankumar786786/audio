"use client";

import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";

export default function Callback() {
  const {
    isAuthenticated,
    isLoading,
    error: authError,
    getAccessTokenSilently,
  } = useAuth0();
  const router = useRouter();
  const [status, setStatus] = useState("Processing login...");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (authError) {
      setErr("Auth0 Error: " + authError.message);
      return;
    }

    if (isLoading) return;

    if (!isAuthenticated) {
      setErr("Authentication failed. Please try logging in again.");
      return;
    }

    const handleCallback = async () => {
      try {
        setStatus("Verifying credentials...");
        // Auth0 has provided the tokens internally.
        // We defer backend registration and session storage to AuthSync.tsx.
        // Once redirected to /home, AuthSync will bridge the authentication.
        router.push("/home");
      } catch (e: any) {
        console.error("Callback error:", e);
        setErr("Error: " + e.message);
      }
    };

    handleCallback();
  }, [isAuthenticated, isLoading, authError, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white font-sans p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>

        {err ? (
          <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="font-bold text-lg mb-1">Something went wrong</h3>
            <p className="text-sm opacity-90">{err}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div className="space-y-2 animate-in fade-in duration-500">
            <h2 className="text-2xl font-semibold tracking-tight">{status}</h2>
            <p className="text-zinc-400 text-sm">
              Please wait while we complete your registration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
