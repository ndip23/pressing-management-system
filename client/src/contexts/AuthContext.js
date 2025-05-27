// client/src/contexts/AuthContext.js
import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    useCallback
} from 'react'; // <--- ****** THIS IS THE CRUCIAL MISSING IMPORT ******
import { jwtDecode } from 'jwt-decode';
import { loginUser as apiLoginUser, getMe as apiGetMe, logoutUserApi } from '../services/api';
import Spinner from '../components/UI/Spinner';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true); // For initial auth check

    const fetchAndSetUser = useCallback(async (jwtToken) => {
        if (jwtToken) {
            try {
                const decoded = jwtDecode(jwtToken);
                if (decoded.exp * 1000 < Date.now()) {
                    console.log("Token expired on load");
                    await logout(); // Token expired
                    return;
                }
                localStorage.setItem('token', jwtToken);
                setToken(jwtToken);

                try {
                    const { data: userData } = await apiGetMe();
                    setUser(userData);
                } catch (meError) {
                    console.error("Failed to fetch /me:", meError.response?.data?.message || meError.message);
                    await logout();
                }

            } catch (error) {
                console.error("Invalid token on load:", error);
                await logout();
            }
        } else {
            await logout();
        }
    }, []); // Removed logout from dependencies for now to re-evaluate if needed

    const logout = useCallback(async () => { // Make logout async if it calls an API
        try {
            if (token) {
                await logoutUserApi();
            }
        } catch (error) {
            console.error("Logout API call failed:", error.response?.data?.message || error.message);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            setToken(null);
            // if (window.location.pathname !== '/login') { // Optional: force redirect
            //     window.location.href = '/login';
            // }
        }
    }, [token]); // Added token as a dependency for the logout API call condition

    // Re-add fetchAndSetUser and logout to the dependency array of useEffect
    // after ensuring they are stable (which they should be with useCallback).
    useEffect(() => {
        const checkUser = async () => {
            setLoading(true);
            const storedToken = localStorage.getItem('token');
            // Pass logout to fetchAndSetUser if it's needed internally and causing dependency issues
            await fetchAndSetUser(storedToken /*, logout */);
            setLoading(false);
        };
        checkUser();
    }, [fetchAndSetUser /*, logout */]); // Re-add logout here if fetchAndSetUser calls it and it's not stable.

    const login = async (username, password) => {
        try {
            const { data } = await apiLoginUser({ username, password });
            // Pass logout to fetchAndSetUser if needed
            await fetchAndSetUser(data.token /*, logout */);
            return true;
        } catch (error) {
            console.error('Login failed context:', error.response?.data?.message || error.message);
            await logout();
            throw error.response?.data || new Error(error.response?.data?.message || 'Login failed');
        }
    };


    const value = {
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        logout,
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