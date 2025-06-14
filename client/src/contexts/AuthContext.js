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
    const [token, setToken] = useState(() => localStorage.getItem('token')); // Initialize from localStorage once
    const [loading, setLoading] = useState(true); // For initial auth check AND login process

    // `logout` function
    // This function primarily interacts with localStorage and resets local state.
    // The API call is secondary. Its stability is key.
    const logout = useCallback(async (options = { redirect: true }) => {
        console.log("[AuthContext] Attempting to logout...");
        const currentTokenForApiCall = localStorage.getItem('token'); // Use fresh value for API call decision
        try {
            if (currentTokenForApiCall) {
                await logoutUserApi();
            }
        } catch (error) {
            console.error("[AuthContext] Logout API call failed:", error.response?.data?.message || error.message);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            setToken(null); // Clear token state
            console.log("[AuthContext] Client-side logout completed.");
            // Navigation is best handled by components consuming the context (e.g., ProtectedRoute)
            // based on isAuthenticated state, rather than a hard redirect here.
        }
    }, []); // `logout` itself should ideally have no dependencies on component state
            // if it's purely about clearing and making a non-state-dependent API call.

    // `fetchAndSetUser` function
    // This function's job is to validate a token and fetch user details.
    // It depends on the `logout` function if a token is invalid/expired.
    const fetchAndSetUser = useCallback(async (jwtToken) => {
        console.log("[AuthContext] fetchAndSetUser called. Token provided:", !!jwtToken);
        if (jwtToken) {
            try {
                const decoded = jwtDecode(jwtToken);
                if (decoded.exp * 1000 < Date.now()) {
                    console.log("[AuthContext] Token expired during fetchAndSetUser, calling logout.");
                    await logout(); return;
                }
                // Token is structurally valid and not expired.
                // Set token in localStorage (might be redundant but ensures it's there before /me)
                localStorage.setItem('token', jwtToken);
                setToken(jwtToken); // Update state

                try {
                    console.log("[AuthContext] Attempting to fetch /me.");
                    const { data: userData } = await apiGetMe(); // Uses token from interceptor
                    setUser(userData);
                    console.log("[AuthContext] User fetched and set:", userData);
                } catch (meError) {
                    console.error("[AuthContext] Failed to fetch /me, calling logout:", meError.response?.data?.message || meError.message);
                    await logout();
                }
            } catch (error) { // Error decoding token or other unexpected error
                console.error("[AuthContext] Invalid token processing or other error, calling logout:", error);
                await logout();
            }
        } else { // No jwtToken provided
            console.log("[AuthContext] No token provided to fetchAndSetUser. Ensuring logged out state.");
            // If there's a user or token in state, it means we were previously logged in.
            // This path could be hit by initial load with no token, or after explicit logout.
            // We only need to clear state if it's not already cleared.
            if (user !== null || token !== null) { // Check current state before calling logout
                await logout();
            } else {
                // If user and token are already null, no need to call logout again.
                // This helps prevent loops if fetchAndSetUser is called multiple times with no token.
                setUser(null); // Ensure state is null
                setToken(null);
            }
        }
    }, [logout, user, token]); // `logout` is stable. `user` and `token` (state variables) are included
                               // because their current values are checked within the logic of this function
                               // (e.g., `if (user !== null || token !== null)`).

    // Effect for initial authentication check on component mount
    useEffect(() => {
        console.log("[AuthContext] Initial authentication check effect running.");
        setLoading(true);
        const storedToken = localStorage.getItem('token');
        fetchAndSetUser(storedToken).finally(() => {
            setLoading(false);
            console.log("[AuthContext] Initial authentication check completed. Loading set to false.");
        });
        // This effect should only run once on mount if fetchAndSetUser is stable.
        // The dependencies of fetchAndSetUser ([logout, user, token]) are key.
        // `logout` is stable (empty dependency array).
        // `user` and `token` changes *could* re-trigger `fetchAndSetUser`'s memoization,
        // which would re-trigger this effect. This chain is what we need to break if it's looping.
    }, [fetchAndSetUser]); // Correct: This effect depends on the `fetchAndSetUser` function.

    const login = async (username, password) => {
        setLoading(true); // Set loading for the login process
        console.log("[AuthContext] Login attempt started.");
        try {
            const { data } = await apiLoginUser({ username, password });
            // `localStorage.setItem` should happen before `fetchAndSetUser` if `fetchAndSetUser` reads from it immediately,
            // but `fetchAndSetUser` takes the token as an argument, so it's fine.
            // Axios interceptor will pick up token from localStorage for subsequent calls *within* fetchAndSetUser.
            localStorage.setItem('token', data.token); // Set token in localStorage first
            await fetchAndSetUser(data.token); // This will validate, set state, and fetch /me
            console.log("[AuthContext] Login successful, user/token state should be set.");
            setLoading(false);
            return true;
        } catch (error) {
            console.error('[AuthContext] Login API call failed or subsequent /me failed:', error.response?.data?.message || error.message);
            await logout(); // Ensure full cleanup
            setLoading(false);
            throw error.response?.data || new Error(error.response?.data?.message || 'Login failed');
        }
    };

    const updateUserInContext = (updatedUserData) => {
        console.log("[AuthContext] Updating user in context with:", updatedUserData);
        setUser(prevUser => {
            if (!prevUser) {
                console.warn("[AuthContext] updateUserInContext called but prevUser is null.");
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
        isAuthenticated: !!user && !!token, // True if both user object and token are truthy
        loading, // Global loading state (primarily for initial auth and login process)
        login,
        logout,
        updateUserInContext,
    };

    // This global loading spinner is for the VERY initial app load.
    // Once `loading` is false after the first check, the app routes will render.
    // `ProtectedRoute` will then handle its own loading/redirect logic.
    if (loading && !token && !user) { // Only show full page spinner if truly in initial unauthenticated loading state
        console.log("[AuthContext] Displaying initial loading spinner for the app.");
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
        throw new Error('useAuth must be used within an AuthProvider. Make sure AuthProvider wraps your App.');
    }
    return context;
};