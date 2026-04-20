import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
import { musicApi } from './api';

// Required for AuthSession to complete the redirect
WebBrowser.maybeCompleteAuthSession();

interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
    profilePictureKey?: string;
    profilePictureUrl?: string;
    createdAt?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    loginWithAuth0: () => Promise<void>;
    logout: () => Promise<void>;
    refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    loginWithAuth0: async () => { },
    logout: async () => { },
    refetch: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Discovery Document
    const discovery = useAutoDiscovery(`https://${process.env.EXPO_PUBLIC_AUTH0_DOMAIN}`);

    // 2. Auth Request
    const redirectUri = makeRedirectUri({
        useProxy: true,
    });
    
    useEffect(() => {
        console.log("[Auth] Redirect URI:", redirectUri);
    }, [redirectUri]);

    const [request, response, promptAsync] = useAuthRequest(
        {
            clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!,
            scopes: ['openid', 'profile', 'email'],
            redirectUri,
            extraParams: {
                audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE || '',
            }
        },
        discovery
    );

    const fetchUser = useCallback(async () => {
        try {
            const userDataJson = await SecureStore.getItemAsync('system_user');
            const token = await SecureStore.getItemAsync('system_token');
            
            if (!token || !userDataJson) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            const userData = JSON.parse(userDataJson);
            setUser(userData);
        } catch (err) {
            console.error("[Auth] Failed to restore session:", err);
            setUser(null);
            await SecureStore.deleteItemAsync('system_token');
            await SecureStore.deleteItemAsync('system_user');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // 3. Handle Auth Response
    useEffect(() => {
        if (response?.type === 'success') {
            const { accessToken } = response.params;
            handleBackendHandshake(accessToken);
        } else if (response?.type === 'error') {
            console.error("[Auth] Login failed:", response.error);
        }
    }, [response]);

    const handleBackendHandshake = async (accessToken: string) => {
        setIsLoading(true);
        try {
            console.log("[Auth] Performing backend handshake...");
            const res = await musicApi.users.register(accessToken);
            
            if (res.success) {
                const userData = res.data;
                setUser(userData);
            } else {
                throw new Error(res.message || "Backend sync failed");
            }
        } catch (err) {
            console.error("[Auth] Handshake error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithAuth0 = async () => {
        try {
            await promptAsync();
        } catch (err) {
            console.error("[Auth] Prompt failed:", err);
        }
    };

    const logout = useCallback(async () => {
        try {
            await SecureStore.deleteItemAsync('system_token');
            await SecureStore.deleteItemAsync('system_user');
            setUser(null);
        } catch (err) {
            console.error("[Auth] Logout error:", err);
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            isLoading: isLoading || !discovery,
            isAuthenticated: !!user,
            loginWithAuth0,
            logout,
            refetch: fetchUser,
        }),
        [user, isLoading, discovery, loginWithAuth0, logout, fetchUser],
    );

    return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
    return useContext(AuthContext);
}
