"use client";

export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let url = input.toString();

  // If the URL is relative or starting with /, prepend NEXT_PUBLIC_API_URL
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    url = `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  // Determine if this is our API or an external one (like imagekit)
  const isOurApi = url.includes(process.env.NEXT_PUBLIC_API_URL || "localhost");

  let token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const headers = new Headers(init?.headers);

  if (token && isOurApi && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(url, {
    ...init,
    headers,
  });

  // Handle 401 Unauthorized
  if (
    response.status === 401 &&
    typeof window !== "undefined" &&
    isOurApi &&
    !url.includes("/auth/refresh-token") &&
    !url.includes("/auth/login") &&
    !url.includes("/auth/verify-otp")
  ) {
    const refreshToken = localStorage.getItem("admin_refresh_token");
    if (refreshToken) {
      try {
        const refreshRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}/auth/refresh-token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          }
        );

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData.accessToken;
          const newRefreshToken = refreshData.refreshToken;

          localStorage.setItem("admin_token", newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem("admin_refresh_token", newRefreshToken);
          }

          // Retry the request with the new access token
          headers.set("Authorization", `Bearer ${newAccessToken}`);
          response = await fetch(url, {
            ...init,
            headers,
          });
        } else {
          // Refresh failed - clear storage and force reload/redirect
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_refresh_token");
          localStorage.removeItem("admin_user");
          window.location.href = "/";
        }
      } catch (err) {
        console.error("[adminFetch] Automatic token refresh failed:", err);
      }
    }
  }

  return response;
}
