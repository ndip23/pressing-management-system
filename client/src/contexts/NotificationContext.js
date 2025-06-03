// client/src/contexts/NotificationContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
// Import the new API service functions
import {
    fetchAdminNotificationsApi,
    markAdminNotificationReadApi,
    markAllAdminNotificationsReadApi
} from '../services/api';

const AdminNotificationContext = createContext(null);

export const AdminNotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false); // Added loading state
    const { user, isAuthenticated } = useAuth();

    const fetchAdminNotifications = useCallback(async () => {
        if (isAuthenticated && user?.role === 'admin') {
            setLoadingNotifications(true);
            console.log("[NotificationContext] Fetching admin notifications from backend...");
            try {
                const { data } = await fetchAdminNotificationsApi(); // API call
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
                console.log("[NotificationContext] Fetched notifications:", data);
            } catch (error) {
                console.error("Failed to fetch admin notifications:", error.response?.data?.message || error.message);
                // Potentially set an error state here to show in UI if needed
                // For now, just log and don't update notifications if fetch fails
            } finally {
                setLoadingNotifications(false);
            }
        } else {
            // Clear notifications if user is not an authenticated admin
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, user]); // Dependencies: re-fetch if auth state changes

    useEffect(() => {
        fetchAdminNotifications(); // Fetch on initial load/auth change

        // Set up polling interval to fetch new notifications periodically
        const intervalId = setInterval(() => {
            // Only fetch if user is still an authenticated admin
            if (isAuthenticated && user?.role === 'admin') {
                fetchAdminNotifications();
            }
        }, 30000); // Poll every 30 seconds (adjust as needed)

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, [fetchAdminNotifications, isAuthenticated, user]); // Add isAuthenticated and user to ensure interval logic is correct

    const markAsRead = async (notificationId) => {
        // Optimistically update UI first for better responsiveness
        const originalNotifications = [...notifications];
        const originalUnreadCount = unreadCount;

        setNotifications(prev =>
            prev.map(n => (n.id === notificationId && !n.read ? { ...n, read: true } : n))
        );
        // Only decrement unreadCount if the notification was actually unread
        const notificationToMark = originalNotifications.find(n => n._id === notificationId || n.id === notificationId); // Backend uses _id
        if (notificationToMark && !notificationToMark.read) {
            setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
        }

        try {
            // API call to mark as read on the backend
            const { data } = await markAdminNotificationReadApi(notificationId);
            // Backend might return the updated notification and new unread count,
            // so we can re-sync the state if needed, though optimistic update is often enough.
            // For simplicity here, we assume optimistic update is fine.
            // Or, you could do:
            // setUnreadCount(data.unreadCount);
            console.log(`[NotificationContext] Notification ${notificationId} marked as read on backend.`);
        } catch (error) {
            console.error(`Failed to mark notification ${notificationId} as read on backend:`, error);
            // Revert optimistic update if backend call fails
            setNotifications(originalNotifications);
            setUnreadCount(originalUnreadCount);
            // Optionally show an error message to the user
            alert("Error updating notification status. Please try again.");
        }
    };

    const clearAllNotifications = async () => { // Renamed to avoid conflict with other clear functions
        const originalNotifications = [...notifications];
        const originalUnreadCount = unreadCount;

        // Optimistically update UI
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            // API call to mark all as read on the backend
            const { data } = await markAllAdminNotificationsReadApi();
            // Backend confirms all marked as read, unreadCount should be 0
            // setUnreadCount(data.unreadCount); // Should be 0
            console.log("[NotificationContext] All notifications marked as read on backend.");
        } catch (error) {
            console.error("Failed to mark all notifications as read on backend:", error);
            // Revert optimistic update
            setNotifications(originalNotifications);
            setUnreadCount(originalUnreadCount);
            alert("Error marking all notifications as read. Please try again.");
        }
    };

    return (
        <AdminNotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loadingNotifications, // Expose loading state
                markAsRead,
                clearAllNotifications, // Use the new name
                fetchAdminNotifications // Expose manual refresh if needed elsewhere
            }}
        >
            {children}
        </AdminNotificationContext.Provider>
    );
};

export const useAdminNotifications = () => {
    const context = useContext(AdminNotificationContext);
    if (context === undefined) {
        throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
    }
    return context;
};