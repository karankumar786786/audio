import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { musicApi } from './api';

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
    loginWithAuth0: (accessToken: string) => Promise<any>;
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

    /**
     * Handshake with AudioBackend using an external provider's accessToken.
     */
    const loginWithAuth0 = useCallback(async (accessToken: string) => {
        try {
            const response = await musicApi.users.register(accessToken);
            if (response.success) {
                const userData = response.data.user || response.data;
                setUser(userData);
                return userData;
            }
            throw new Error(response.message || "Synchronization failed");
        } catch (err) {
            console.error("[Auth] Handshake error:", err);
            throw err;
        }
    }, []);

    const logout = useCallback(async () => {
        await SecureStore.deleteItemAsync('system_token');
        await SecureStore.deleteItemAsync('system_user');
        setUser(null);
    }, []);

    const value = React.useMemo(
        () => ({
            user,
            isLoading,
            isAuthenticated: !!user,
            loginWithAuth0,
            logout,
            refetch: fetchUser,
        }),
        [user, isLoading, loginWithAuth0, logout, fetchUser],
    );

    return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
    return useContext(AuthContext);
}
