// client/src/contexts/NotificationContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
    fetchAdminNotificationsApi,
    markAdminNotificationReadApi,
    markAllAdminNotificationsReadApi
} from '../services/api';

const AdminNotificationContext = createContext(null);

export const AdminNotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const { user, isAuthenticated } = useAuth();

    const fetchAdminNotifications = useCallback(async () => {
        if (isAuthenticated && user?.role === 'admin') {
            // Avoid fetching if already loading to prevent race conditions from interval
            if (loadingNotifications) return;

            setLoadingNotifications(true);
            // console.log("[NotificationContext] Fetching admin notifications from backend...");
            try {
                const { data } = await fetchAdminNotificationsApi();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
                // console.log("[NotificationContext] Fetched notifications:", data.notifications, "Unread:", data.unreadCount);
            } catch (error) {
                console.error("Failed to fetch admin notifications:", error.response?.data?.message || error.message);
                // Optionally, you could set an error state to display in the UI
                // For now, if fetch fails, notifications might appear empty or stale
            } finally {
                setLoadingNotifications(false);
            }
        } else {
            // Clear notifications if user logs out or is not an admin
            if (notifications.length > 0 || unreadCount > 0) { // Only update state if it needs clearing
                setNotifications([]);
                setUnreadCount(0);
            }
        }
    }, [isAuthenticated, user, loadingNotifications, notifications.length, unreadCount]); // Added loadingNotifications to prevent concurrent fetches

    useEffect(() => {
        fetchAdminNotifications(); // Initial fetch

        const intervalId = setInterval(() => {
            // The check inside fetchAdminNotifications handles if user is still admin/auth
            fetchAdminNotifications();
        }, 30000); // Poll every 30 seconds (adjust as needed, or implement WebSockets)

        return () => clearInterval(intervalId); // Cleanup interval
    }, [fetchAdminNotifications]); // fetchAdminNotifications is memoized

    const markAsRead = async (notificationId) => {
        const originalNotifications = [...notifications];
        const notificationToMark = originalNotifications.find(n => n._id === notificationId);

        // Optimistic UI Update
        if (notificationToMark && !notificationToMark.read) {
            setNotifications(prevNots => prevNots.map(n => n._id === notificationId ? { ...n, read: true } : n));
            setUnreadCount(prevCount => (prevCount > 0 ? prevCount - 1 : 0));
        } else if (!notificationToMark) {
             console.warn(`[NotificationContext] markAsRead: Notification ID ${notificationId} not found.`);
            return;
        } else if (notificationToMark.read) {
            // Already read, no action needed for state or API
            return;
        }


        try {
            const { data } = await markAdminNotificationReadApi(notificationId);
            // Backend response might include the new unreadCount, good for re-syncing
            if (typeof data.unreadCount === 'number') {
                setUnreadCount(data.unreadCount);
            }
            // Optionally update the specific notification object again from data.notification if needed
            console.log(`[NotificationContext] Notification ${notificationId} marked as read on backend.`);
        } catch (error) {
            console.error(`Failed to mark notification ${notificationId} as read on backend:`, error);
            // Revert optimistic update if backend call fails
            setNotifications(originalNotifications);
            if (notificationToMark && !notificationToMark.read) { // Only revert count if it was decremented
                 setUnreadCount(prev => prev + 1);
            }
            alert("Error updating notification status. Please try again.");
        }
    };

    const clearAllNotifications = async () => {
        const originalNotifications = notifications.map(n => ({...n})); // Deep copy for potential revert
        const originalUnreadCount = unreadCount;

        // Optimistic UI Update
        setNotifications(prevNots => prevNots.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await markAllAdminNotificationsReadApi();
            console.log("[NotificationContext] All notifications marked as read on backend.");
            // Backend should confirm unreadCount is 0, or we can trust our optimistic update here.
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
                loadingNotifications,
                markAsRead,
                clearAllNotifications,
                fetchAdminNotifications // Expose for manual refresh if desired
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