import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi, type User } from '../api/authApi';
import { TOKEN_KEY } from '../api/axiosInstance';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    authExpiredMessage: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<boolean>;
    clearAuthExpiredMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [isLoading, setIsLoading] = useState(true);
    const [authExpiredMessage, setAuthExpiredMessage] = useState<string | null>(null);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    }, []);

    const clearAuthExpiredMessage = useCallback(() => {
        setAuthExpiredMessage(null);
    }, []);

    const checkAuth = useCallback(async (): Promise<boolean> => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        if (!storedToken) {
            setIsLoading(false);
            return false;
        }

        try {
            const userData = await authApi.getMe();
            setUser(userData);
            setToken(storedToken);
            setIsLoading(false);
            return true;
        } catch (error) {
            logout();
            setIsLoading(false);
            return false;
        }
    }, [logout]);

    const login = async (email: string, password: string): Promise<void> => {
        const response = await authApi.login(email, password);
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        setToken(response.accessToken);
        setUser(response.user);
    };

    // Listen for unauthorized events from axios interceptor
    useEffect(() => {
        const handleUnauthorized = (event: CustomEvent<string>) => {
            logout();
            if (event.detail) {
                setAuthExpiredMessage(event.detail);
            }
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized as EventListener);
        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized as EventListener);
        };
    }, [logout]);

    // Check auth on mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        authExpiredMessage,
        login,
        logout,
        checkAuth,
        clearAuthExpiredMessage,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
