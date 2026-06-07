// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { 
    loginUser as apiLoginUser, 
    getMe as apiGetMe, 
    logoutUserApi, 
    setAuthHeader // Ensure you exported this from api.js
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const logout = useCallback(async () => {
        try {
            // Only try to call logout API if we actually have a token
            if (localStorage.getItem('token')) {
                await logoutUserApi().catch(() => {}); // ignore error on logout
            }
        } finally {
            localStorage.removeItem('token');
            setAuthHeader(null); // Clear axios header
            setUser(null);
            setToken(null);
            setLoading(false);
        }
    }, []);

    const fetchAndSetUser = useCallback(async (jwtToken) => {
        if (!jwtToken) return;

        try {
            // 1. Manually force the header into Axios instance IMMEDIATELY
            setAuthHeader(jwtToken); 

            // 2. Decode for local checks (expiration)
            const decoded = jwtDecode(jwtToken);
            if (decoded.exp * 1000 < Date.now()) {
                await logout();
                return;
            }

            // 3. Fetch full profile from backend
            const { data: userData } = await apiGetMe();
            
            // 4. Update state only if request succeeded
            localStorage.setItem('token', jwtToken);
            setToken(jwtToken);
            setUser(userData);
            return true;
        } catch (error) {
            console.error("Auth fetch failed:", error.response?.data?.message || error.message);
            // If it's a 401, clear local data to stop the loop
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                setAuthHeader(null);
                setUser(null);
                setToken(null);
            }
            return false;
        }
    }, [logout]);

    useEffect(() => {
        const initAuth = async () => {
            setLoading(true);
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                await fetchAndSetUser(storedToken);
            }
            setLoading(false);
        };
        initAuth();
    }, [fetchAndSetUser]);

    const login = async (username, password) => {
        setLoading(true);
        try {
            const { data } = await apiLoginUser({ username, password });
            const success = await fetchAndSetUser(data.token);
            return success;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const loginWithToken = useCallback(async (newToken) => {
        setLoading(true);
        const success = await fetchAndSetUser(newToken);
        setLoading(false);
        return success;
    }, [fetchAndSetUser]);

    const value = {
        user,
        token,
        isAuthenticated: !!user && !!token,
        isSubscriptionActive: ['active', 'trial', 'trialing'].includes(user?.tenant?.subscriptionStatus),
        loading,
        login,
        logout,
        loginWithToken,
        updateUserInContext: (updated) => setUser(prev => ({ ...prev, ...updated })),
        refreshUser: async () => fetchAndSetUser(localStorage.getItem('token')),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};