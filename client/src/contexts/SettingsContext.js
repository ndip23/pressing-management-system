// client/src/contexts/SettingsContext.js (NEW FILE)
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // To know when a user is logged in
import { fetchAppSettings } from '../services/api'; // The API call to get settings

// Create the context with a default structure
const SettingsContext = createContext({
    settings: {
        companyInfo: {},
        notificationTemplates: {},
        itemTypes: [],
        serviceTypes: [],
        defaultCurrencySymbol: '$', // Default fallback
    },
    loadingSettings: true,
    loadSettings: () => {},
});

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(null);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const { isAuthenticated } = useAuth(); // Use auth status to trigger fetch

    const loadSettings = useCallback(async () => {
        if (!isAuthenticated) {
            // If user is not authenticated, we don't need to load tenant-specific settings.
            // We can clear any existing settings if a user logs out.
            setSettings(null);
            setLoadingSettings(false);
            return;
        }

        setLoadingSettings(true);
        try {
            console.log("[SettingsContext] Authenticated user detected. Fetching app settings...");
            const { data } = await fetchAppSettings();
            setSettings(data);
            console.log("[SettingsContext] Settings loaded successfully:", data);
        } catch (error) {
            console.error("Failed to load app settings into context:", error);
            // In case of error, you might want to set some sensible defaults
            setSettings({ companyInfo: {}, notificationTemplates: {}, defaultCurrencySymbol: '$' });
        } finally {
            setLoadingSettings(false);
        }
    }, [isAuthenticated]); // Re-run this function only when authentication status changes

    useEffect(() => {
        loadSettings();
    }, [loadSettings]); // The dependency array contains the memoized function

    return (
        <SettingsContext.Provider value={{ settings, loadingSettings, loadSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

// Custom hook to easily use the context
export const useAppSettings = () => useContext(SettingsContext);