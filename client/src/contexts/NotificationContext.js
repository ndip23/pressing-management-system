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
    const { isAuthenticated } = useAuth(); // We only need to check if a user is logged in, not their role

    const fetchNotifications = useCallback(async () => {
        // Fetch notifications for ANY authenticated user.
        // The backend /api/notifications route will return notifications for the user making the request.
        if (isAuthenticated) {
            if (loadingNotifications) return; // Prevent concurrent fetches
            setLoadingNotifications(true);
            try {
                const { data } = await fetchAdminNotificationsApi(); // This function now calls /api/notifications
                const processedNotifications = (data.notifications || []).map(n => ({
                    ...n,
                    timestamp: new Date(n.createdAt || n.timestamp || Date.now())
                }));
                setNotifications(processedNotifications);
                setUnreadCount(data.unreadCount || 0);
            } catch (error) {
                console.error("Failed to fetch notifications:", error.response?.data?.message || error.message);
                // Clear state on failure to avoid showing stale data
                setNotifications([]);
                setUnreadCount(0);
            } finally {
                setLoadingNotifications(false);
            }
        } else {
            // If user logs out or is not authenticated, clear notifications
            if (notifications.length > 0 || unreadCount > 0) {
                setNotifications([]);
                setUnreadCount(0);
            }
        }
    }, [isAuthenticated, loadingNotifications, notifications.length, unreadCount]); // Added dependencies

    useEffect(() => {
        fetchNotifications(); // Initial fetch when auth state changes

        const intervalId = setInterval(() => {
            // The check inside fetchNotifications handles if user is still authenticated
            fetchNotifications();
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(intervalId); // Cleanup interval
    }, [fetchNotifications]); // Dependency is the memoized fetch function

    const markAsRead = async (notificationId) => {
        const originalNotifications = [...notifications];
        const notificationToMark = originalNotifications.find(n => n._id === notificationId);

        // Optimistic UI Update for responsiveness
        if (notificationToMark && !notificationToMark.read) {
            setNotifications(prev => prev.map(n => (n._id === notificationId ? { ...n, read: true } : n)));
            setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
        } else {
            if (!notificationToMark) console.warn(`[NotificationContext] markAsRead: Notification ID ${notificationId} not found.`);
            return; // Exit if already read or not found
        }

        try {
            const { data } = await markAdminNotificationReadApi(notificationId);
            // Re-sync unread count from the backend response for accuracy
            if (typeof data.unreadCount === 'number') {
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error(`Failed to mark notification ${notificationId} as read on backend:`, error);
            // Revert UI on failure
            setNotifications(originalNotifications);
            setUnreadCount(originalNotifications.filter(n => !n.read).length); // Recalculate precisely
            alert("Error updating notification status. Please try again.");
        }
    };

    const clearAllNotifications = async () => {
        const originalNotifications = notifications.map(n => ({...n}));
        const originalUnreadCount = unreadCount;

        // Optimistic UI Update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await markAllAdminNotificationsReadApi();
        } catch (error) {
            console.error("Failed to mark all notifications as read on backend:", error);
            // Revert UI on failure
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
                fetchNotifications, // Expose for manual refresh
            }}
        >
            {children}
        </AdminNotificationContext.Provider>
    );
};

// The custom hook name remains the same as requested
export const useAdminNotifications = () => {
    const context = useContext(AdminNotificationContext);
    if (context === undefined) {
        throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
    }
    return context;
};