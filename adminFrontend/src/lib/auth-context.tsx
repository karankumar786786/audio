"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin" | "superadmin";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string) => Promise<{ success: boolean; token: string; message?: string }>;
  register: (name: string, email: string) => Promise<{ success: boolean; token: string; message?: string }>;
  verifyOtp: (email: string, otp: string, token: string) => Promise<{ success: boolean; message?: string }>;
  resendOtp: (email: string, token: string) => Promise<{ success: boolean; token?: string; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Hydrate session from localStorage
    const savedUser = localStorage.getItem("admin_user");
    const savedToken = localStorage.getItem("admin_token");
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
      } catch (err) {
        console.error("Failed to parse admin_user", err);
        localStorage.removeItem("admin_user");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_refresh_token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to log in");
    }
    return { success: true, token: data.data.token };
  };

  const register = async (name: string, email: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to register");
    }
    return { success: true, token: data.data.token };
  };

  const verifyOtp = async (email: string, otp: string, emailToken: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, token: emailToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to verify OTP");
    }

    const { accessToken, refreshToken, user: userData } = data.data;
    localStorage.setItem("admin_token", accessToken);
    localStorage.setItem("admin_refresh_token", refreshToken);
    localStorage.setItem("admin_user", JSON.stringify(userData));

    setUser(userData);
    setToken(accessToken);
    return { success: true };
  };

  const resendOtp = async (email: string, emailToken: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token: emailToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to resend OTP");
    }
    return { success: true, token: data.data.token };
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
    setUser(null);
    setToken(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
