import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    type User,
    type ProfileIcon,
    type SessionDuration,
    SESSION_DURATIONS,
    PROFILE_ICONS,
    authenticateUser,
    registerUser,
    changePassword,
    updateProfile,
    createSession,
    getSession,
    clearSession,
    getCurrentUser
} from '../services/authService';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    sessionDuration: SessionDuration;
    login: (username: string, password: string, rememberDuration: SessionDuration) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    updatePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    updateUserProfile: (updates: { displayName?: string; profileIcon?: ProfileIcon }) => Promise<{ success: boolean; error?: string }>;
    setSessionDuration: (duration: SessionDuration) => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_DURATION_KEY = 'flow_session_duration';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionDuration, setSessionDurationState] = useState<SessionDuration>(() => {
        const saved = localStorage.getItem(SESSION_DURATION_KEY);
        return (saved as SessionDuration) || '7d';
    });

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            setIsLoading(true);
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setIsLoading(false);
        };

        checkSession();
    }, []);

    // Save session duration preference
    useEffect(() => {
        localStorage.setItem(SESSION_DURATION_KEY, sessionDuration);
    }, [sessionDuration]);

    const refreshUser = useCallback(async () => {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
    }, []);

    const login = useCallback(async (
        username: string,
        password: string,
        rememberDuration: SessionDuration
    ): Promise<{ success: boolean; error?: string }> => {
        const authenticatedUser = await authenticateUser(username, password);

        if (!authenticatedUser) {
            return { success: false, error: 'wrongCredentials' };
        }

        createSession(authenticatedUser.id, rememberDuration);
        setUser(authenticatedUser);
        setSessionDurationState(rememberDuration);

        return { success: true };
    }, []);

    const logout = useCallback(() => {
        clearSession();
        setUser(null);
    }, []);

    const register = useCallback(async (
        username: string,
        password: string
    ): Promise<{ success: boolean; error?: string }> => {
        const result = await registerUser(username, password);
        return result;
    }, []);

    const updatePassword = useCallback(async (
        oldPassword: string,
        newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
        if (!user) {
            return { success: false, error: 'notAuthenticated' };
        }

        const result = await changePassword(user.id, oldPassword, newPassword);
        return result;
    }, [user]);

    const updateUserProfile = useCallback(async (
        updates: { displayName?: string; profileIcon?: ProfileIcon }
    ): Promise<{ success: boolean; error?: string }> => {
        if (!user) {
            return { success: false, error: 'notAuthenticated' };
        }

        const result = await updateProfile(user.id, updates);
        if (result.success) {
            await refreshUser();
        }
        return result;
    }, [user, refreshUser]);

    const setSessionDuration = useCallback((duration: SessionDuration) => {
        setSessionDurationState(duration);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isAdmin: user?.isAdmin ?? false,
            isLoading,
            sessionDuration,
            login,
            logout,
            register,
            updatePassword,
            updateUserProfile,
            setSessionDuration,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Export types and constants for use elsewhere
export { SESSION_DURATIONS, PROFILE_ICONS };
export type { SessionDuration, ProfileIcon };
