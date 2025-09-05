// client/src/contexts/DirectoryAuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { loginDirectoryAdminApi } from '../services/api';

const DirectoryAuthContext = createContext(null);

export const DirectoryAuthProvider = ({ children }) => {
    const [dirAdminToken, setDirAdminToken] = useState(null);
    const [isDirAdminAuthenticated, setIsDirAdminAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // <-- STARTS TRUE

    // Effect to check token on initial app load
    useEffect(() => {
        const checkToken = async () => {
            const token = localStorage.getItem('directoryAdminToken');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.exp * 1000 > Date.now()) {
                        setIsDirAdminAuthenticated(true);
                        setDirAdminToken(token);
                    } else {
                        localStorage.removeItem('directoryAdminToken');
                    }
                } catch (error) {
                    console.error("Invalid directory admin token on load:", error);
                    localStorage.removeItem('directoryAdminToken');
                }
            }
            setLoading(false); // <-- SETS TO FALSE AFTER CHECK IS DONE
        };
        checkToken();
    }, []);

    const dirAdminLogin = async (credentials) => {
        try {
            const { data } = await loginDirectoryAdminApi(credentials);
            localStorage.setItem('directoryAdminToken', data.token);
            setDirAdminToken(data.token);
            setIsDirAdminAuthenticated(true);
        } catch (error) {
            localStorage.removeItem('directoryAdminToken');
            setDirAdminToken(null);
            setIsDirAdminAuthenticated(false);
            throw error; // Re-throw so the login page can catch it
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
        loading, // <-- EXPORT LOADING STATE
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