// client/src/contexts/DirectoryAuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { loginDirectoryAdminApi } from '../services/api';
import Spinner from '../components/UI/Spinner';

const DirectoryAuthContext = createContext(null);

export const DirectoryAuthProvider = ({ children }) => {
    const [dirAdminToken, setDirAdminToken] = useState(localStorage.getItem('directoryAdminToken'));
    const [isDirAdminAuthenticated, setIsDirAdminAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('directoryAdminToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 > Date.now()) {
                    setIsDirAdminAuthenticated(true);
                    setDirAdminToken(token);
                } else {
                    // Token expired, log out
                    localStorage.removeItem('directoryAdminToken');
                    setIsDirAdminAuthenticated(false);
                    setDirAdminToken(null);
                }
            } catch (error) {
                console.error("Invalid directory admin token:", error);
                localStorage.removeItem('directoryAdminToken');
                setIsDirAdminAuthenticated(false);
                setDirAdminToken(null);
            }
        }
        setLoading(false);
    }, []);

    const dirAdminLogin = async (credentials) => {
        try {
            const { data } = await loginDirectoryAdminApi(credentials);
            localStorage.setItem('directoryAdminToken', data.token);
            setDirAdminToken(data.token);
            setIsDirAdminAuthenticated(true);
        } catch (error) {
            // Re-throw the error so the login page can catch it and display a message
            throw error;
        }
    };

    const dirAdminLogout = useCallback(() => {
        localStorage.removeItem('directoryAdminToken');
        setDirAdminToken(null);
        setIsDirAdminAuthenticated(false);
        // No API call is needed for logout in this simple setup
    }, []);

    const value = {
        dirAdminToken,
        isDirAdminAuthenticated,
        loading,
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