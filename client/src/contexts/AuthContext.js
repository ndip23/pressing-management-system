// client/src/contexts/AuthContext.js
import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    useCallback
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { loginUser as apiLoginUser, getMe as apiGetMe, logoutUserApi } from '../services/api';
import Spinner from '../components/UI/Spinner';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token')); 
    const [loading, setLoading] = useState(true); 

   
    const logout = useCallback(async () => {
        console.log("[AuthContext] Logging out...");
        try {
           
            if (localStorage.getItem('token')) { 
                await logoutUserApi();
            }
        } catch (error) {
            console.error("[AuthContext] Logout API call failed:", error.response?.data?.message || error.message);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            setToken(null); // Clear token state
            console.log("[AuthContext] Client-side logout completed.");
        }
    }, []); 

    const fetchAndSetUser = useCallback(async (jwtToken) => {
        if (jwtToken) {
            try {
                const decoded = jwtDecode(jwtToken);
                if (decoded.exp * 1000 < Date.now()) {
                    console.log("[AuthContext] Token expired on load, logging out.");
                    await logout(); // Use the memoized logout
                    return;
                }
               
                localStorage.setItem('token', jwtToken);
                setToken(jwtToken);

                try {
                    const { data: userData } = await apiGetMe(); // apiGetMe will use the token via interceptor
                    setUser(userData);
                    console.log("[AuthContext] User fetched and set:", userData);
                } catch (meError) {
                    console.error("[AuthContext] Failed to fetch /me, logging out:", meError.response?.data?.message || meError.message);
                    await logout(); 
                }
            } catch (error) {
                console.error("[AuthContext] Invalid token on load, logging out:", error);
                await logout(); 
            }
        } else {

            if (user || token) { 
                 console.log("[AuthContext] No token found, ensuring logout state if previously logged in.");
                 await logout();
            } else {
                setUser(null);
                setToken(null);
            }
        }
    }, [logout, user, token]); 
    useEffect(() => {
        const checkUser = async () => {
            console.log("[AuthContext] Initial checkUser effect running.");
            setLoading(true);
            const storedToken = localStorage.getItem('token');
            await fetchAndSetUser(storedToken);
            setLoading(false);
            console.log("[AuthContext] Initial checkUser effect finished.");
        };
        checkUser();
    }, [fetchAndSetUser]);

    const login = async (username, password) => {
        try {
            const { data } = await apiLoginUser({ username, password });
            await fetchAndSetUser(data.token); 
            return true; 
        } catch (error) {
            console.error('[AuthContext] Login failed:', error.response?.data?.message || error.message);
            
            await logout(); 
            throw error.response?.data || new Error(error.response?.data?.message || 'Login failed');
        }
    };

    const updateUserInContext = (updatedUserData) => {
        console.log("[AuthContext] Updating user in context with:", updatedUserData);
        setUser(prevUser => {
            if (!prevUser) {
                console.warn("[AuthContext] updateUserInContext called but prevUser is null. Setting user directly.");
                return { ...updatedUserData }; 
            }
            const newUserState = { ...prevUser, ...updatedUserData };
            console.log("[AuthContext] New user state after update:", newUserState);
            return newUserState;
        });

    };

    const value = {
        user,
        token,
        isAuthenticated: !!user && !!token, 
        loading, 
        login,
        logout,
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