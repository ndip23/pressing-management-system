// client/src/contexts/NotificationContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Assuming AuthContext.js is in the same 'contexts' folder

// Corrected import path for API service functions
import {
    fetchAdminNotificationsApi,
    markAdminNotificationReadApi,
    markAllAdminNotificationsReadApi
} from '../services/api'; // From src/contexts/ to src/services/

const AdminNotificationContext = createContext(null);

export const AdminNotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const { user, isAuthenticated } = useAuth();

    const fetchAdminNotifications = useCallback(async () => {
        if (isAuthenticated && user?.role === 'admin') {
            setLoadingNotifications(true);
            console.log("[NotificationContext] Fetching admin notifications from backend...");
            try {
                const { data } = await fetchAdminNotificationsApi(); // API call
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
                console.log("[NotificationContext] Fetched notifications:", data.notifications, "Unread:", data.unreadCount);
            } catch (error) {
                console.error("Failed to fetch admin notifications:", error.response?.data?.message || error.message);
                // Optionally set an error state here to show in UI if needed
            } finally {
                setLoadingNotifications(false);
            }
        } else {
            // Clear notifications if user is not an authenticated admin or logs out
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, user]); // Dependencies: re-fetch if auth state or user role changes

    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            fetchAdminNotifications(); // Initial fetch when admin logs in or context mounts for an admin

            const intervalId = setInterval(() => {
                // Only poll if user is still an authenticated admin
                if (isAuthenticated && user?.role === 'admin') {
                    fetchAdminNotifications();
                }
            }, 30000); // Poll every 30 seconds (adjust as needed)

            return () => clearInterval(intervalId); // Cleanup interval on component unmount or if auth state changes
        } else {
            // If user logs out or is not admin, clear any existing interval if necessary (though useEffect cleanup handles it)
            setNotifications([]); // Ensure notifications are cleared if user state changes from admin
            setUnreadCount(0);
        }
    }, [fetchAdminNotifications, isAuthenticated, user]); // Effect dependencies

    const markAsRead = async (notificationId) => {
        const originalNotifications = [...notifications];
        const originalUnreadCount = unreadCount;

        // Optimistic UI Update
        const notificationToMark = originalNotifications.find(n => n._id === notificationId);
        if (notificationToMark && !notificationToMark.read) {
            setNotifications(prev =>
                prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
            );
            setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
        } else if (!notificationToMark) {
            console.warn(`[NotificationContext] markAsRead: Notification with ID ${notificationId} not found in current list.`);
            return; // Don't proceed if not found or already read
        }


        try {
            const { data } = await markAdminNotificationReadApi(notificationId);
            // Backend returns the new unreadCount, so update based on that for consistency
            if (typeof data.unreadCount === 'number') {
                setUnreadCount(data.unreadCount);
            }
            // The specific notification object might also be returned, you could update it fully
            // For now, the optimistic update of `read:true` is likely sufficient.
            console.log(`[NotificationContext] Notification ${notificationId} marked as read on backend.`);
        } catch (error) {
            console.error(`Failed to mark notification ${notificationId} as read on backend:`, error.response?.data?.message || error.message);
            // Revert optimistic update if backend call fails
            setNotifications(originalNotifications);
            setUnreadCount(originalUnreadCount);
            // Optionally show an error message to the user (e.g., using a toast library)
            alert("Error updating notification status. Please try again.");
        }
    };

    const clearAllNotifications = async () => {
        const originalNotifications = [...notifications];
        const originalUnreadCount = unreadCount;

        // Optimistic UI Update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await markAllAdminNotificationsReadApi();
            // Backend confirms all marked as read, unreadCount should be 0
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
                loadingNotifications,
                markAsRead,
                clearAllNotifications,
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