// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser as apiLoginUser, getMe as apiGetMe } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true); // For initial auth check

    const logout = useCallback(async () => {
        try {
            await AsyncStorage.removeItem('token');
        } catch (e) {
            console.error("Error removing token from AsyncStorage", e);
        }
        setUser(null);
        setToken(null);
    }, []);

    const fetchAndSetUser = useCallback(async (jwtToken) => {
        if (jwtToken) {
            try {
                const decoded = jwtDecode(jwtToken);
                if (decoded.exp * 1000 < Date.now()) {
                    await logout(); return;
                }
                setToken(jwtToken);
                await AsyncStorage.setItem('token', jwtToken);
                const { data: userData } = await apiGetMe();
                setUser(userData);
            } catch (error) {
                console.error("Invalid token or failed to fetch user:", error);
                await logout();
            }
        } else {
            await logout();
        }
    }, [logout]);

    useEffect(() => {
        const checkUser = async () => {
            setLoading(true);
            try {
                const storedToken = await AsyncStorage.getItem('token');
                await fetchAndSetUser(storedToken);
            } catch (e) {
                console.error("Error during initial user check:", e);
                await logout();
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, [fetchAndSetUser, logout]);

    const login = async (username, password) => {
        try {
            const { data } = await apiLoginUser({ username, password });
            await fetchAndSetUser(data.token);
        } catch (error) {
            console.error('Login failed context:', error.response?.data?.message || error.message);
            await logout();
            throw error.response?.data || new Error(error.response?.data?.message || 'Login failed');
        }
    };
    
    const value = { user, token, isAuthenticated: !!user, loading, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);