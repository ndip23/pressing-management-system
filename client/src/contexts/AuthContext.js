// client/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { loginUser as apiLoginUser, getMe as apiGetMe, logoutUserApi } from '../services/api';
import Spinner from '../components/UI/Spinner'; // Assuming you have this

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token')); // Initialize from localStorage
    const [loading, setLoading] = useState(true);

    const logout = useCallback(async () => {
        try {
            if (localStorage.getItem('token')) { // Check localStorage directly
                await logoutUserApi();
            }
        } catch (error) {
            console.error("Logout API call failed:", error.response?.data?.message || error.message);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            setToken(null);
        }
    }, []); // This useCallback has no dependencies as it uses localStorage directly, so it's stable.

    const fetchAndSetUser = useCallback(async (jwtToken) => {
        if (jwtToken) {
            try {
                const decoded = jwtDecode(jwtToken);
                if (decoded.exp * 1000 < Date.now()) {
                    console.log("Token expired on load");
                    await logout();
                    return;
                }
                localStorage.setItem('token', jwtToken); // Ensure token is set for API calls
                setToken(jwtToken);

                try {
                    const { data: userData } = await apiGetMe();
                    setUser(userData);
                } catch (meError) {
                    console.error("Failed to fetch current user (/me):", meError.response?.data?.message || meError.message);
                    await logout(); // Logout if /me fails
                }
            } catch (error) {
                console.error("Invalid token on load:", error);
                await logout();
            }
        } else {
            // If no token is provided, ensure we are in a logged-out state
            await logout();
        }
    }, [logout]); // <<<<< CORRECTED: ADDED 'logout' TO THE DEPENDENCY ARRAY

    useEffect(() => {
        const checkUser = async () => {
            setLoading(true);
            const storedToken = localStorage.getItem('token');
            await fetchAndSetUser(storedToken);
            setLoading(false);
        };
        checkUser();
    }, [fetchAndSetUser]); // This dependency is correct

    const login = async (username, password) => {
        try {
            const { data } = await apiLoginUser({ username, password });
            await fetchAndSetUser(data.token);
            return true;
        } catch (error) {
            await logout(); // Ensure clean state on login failure
            // Re-throw the specific error for the login page to handle
            throw error.response?.data || new Error(error.response?.data?.message || 'Login failed');
        }
    };

    // This function is for the multi-step signup flow
    const loginWithToken = useCallback(async (newToken) => {
        await fetchAndSetUser(newToken);
    }, [fetchAndSetUser]);

    const updateUserInContext = (updatedUserData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...updatedUserData,
        }));
    };

    const value = {
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        logout,
        loginWithToken,
        updateUserInContext,
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Spinner size="lg"/></div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};