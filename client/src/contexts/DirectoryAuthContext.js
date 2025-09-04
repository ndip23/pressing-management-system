// client/src/contexts/DirectoryAuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { loginDirectoryAdminApi } from '../services/api';
// Spinner import is not needed here, but in the components that use the loading state

const DirectoryAuthContext = createContext(null);

export const DirectoryAuthProvider = ({ children }) => {
    const [dirAdminToken, setDirAdminToken] = useState(null);
    const [isDirAdminAuthenticated, setIsDirAdminAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // <<<<<< ADD THIS STATE

    // Effect to check token on initial load
    useEffect(() => {
        const checkToken = async () => {
            const token = localStorage.getItem('directoryAdminToken');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.exp * 1000 > Date.now()) {
                        // Token is valid and not expired
                        setIsDirAdminAuthenticated(true);
                        setDirAdminToken(token);
                    } else {
                        // Token expired
                        localStorage.removeItem('directoryAdminToken');
                    }
                } catch (error) {
                    console.error("Invalid directory admin token on load:", error);
                    localStorage.removeItem('directoryAdminToken');
                }
            }
            // Finished checking, set loading to false
            setLoading(false);
        };
        checkToken();
    }, []);

    const dirAdminLogin = async (credentials) => {
        try {
            const { data } = await loginDirectoryAdminApi(credentials);
            localStorage.setItem('directoryAdminToken', data.token);
            setDirAdminToken(data.token);
            setIsDirAdminAuthenticated(true); // This state update triggers navigation
        } catch (error) {
            // Clear any partial state on failure
            localStorage.removeItem('directoryAdminToken');
            setDirAdminToken(null);
            setIsDirAdminAuthenticated(false);
            // Re-throw so the login page can catch it and display an error message
            throw error;
        }
    };

    const dirAdminLogout = useCallback(() => {
        localStorage.removeItem('directoryAdminToken');
        setDirAdminToken(null);
        setIsDirAdminAuthenticated(false);
    }, []);

    const value = {
        dirAdminToken,
        isDirAdminAuthenticated,
        loading, // <<<<<< EXPORT THIS STATE
        dirAdminLogin,
        dirAdminLogout,
    };

    return (
        <DirectoryAuthContext.Provider value={value}>
            {children}
        </DirectoryAuthContext.Provider>
    );
};

export const useDirectoryAuth = () => {
    const context = useContext(DirectoryAuthContext);
    if (context === undefined) {
        throw new Error('useDirectoryAuth must be used within a DirectoryAuthProvider');
    }
    return context;
};