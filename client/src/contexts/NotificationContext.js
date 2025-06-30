//client/src/contexts/NotificationContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
    fetchAdminNotificationsApi,
    markAdminNotificationReadApi,
    markAllAdminNotificationsReadApi
} from '../services/api'; // Ensure these are correctly defined in api.js

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
                const { data } = await fetchAdminNotificationsApi();
                // Ensure timestamps are valid Date objects or parseable strings
                const processedNotifications = (data.notifications || []).map(n => ({
                    ...n,
                    // If backend sends createdAt/updatedAt as strings, ensure they are parsable
                    // For this context, we expect a 'timestamp' field. If it comes as 'createdAt' from DB:
                    timestamp: new Date(n.createdAt || n.timestamp || Date.now()) // Fallback to now if missing
                }));
                setNotifications(processedNotifications);
                setUnreadCount(data.unreadCount || 0);
                console.log("[NotificationContext] Fetched and processed notifications:", processedNotifications);
            } catch (error) {
                console.error("Failed to fetch admin notifications:", error.response?.data?.message || error.message);
                // Fallback to simulated data for UI development if API fails, or clear them
                // For now, let's clear them if API fails to avoid using stale simulated data
                setNotifications([]);
                setUnreadCount(0);
            } finally {
                setLoadingNotifications(false);
            }
        } else {
            // Using SIMULATED DATA if not authenticated admin for development/UI testing
            console.warn("[NotificationContext] Not an authenticated admin. Using SIMULATED notifications for UI testing.");
            const now = new Date();
            const twoHoursWarning = new Date(now.getTime() + 1.9 * 60 * 60 * 1000);
            const isAlreadyOverdue = new Date(now.getTime() - 1 * 60 * 60 * 1000);
            const mockNotifications = [
                { id: 'sim1', _id: 'sim1', type: 'overdue_warning', message: `Order #MOCK-001 due at ${twoHoursWarning.toLocaleTimeString()}`, link: `/orders/MOCK-001`, timestamp: now, read: false },
                { id: 'sim2', _id: 'sim2', type: 'overdue_alert', message: `Order #MOCK-002 is OVERDUE (was due ${isAlreadyOverdue.toLocaleTimeString()})`, link: `/orders/MOCK-002`, timestamp: isAlreadyOverdue, read: true },
                { id: 'sim3', _id: 'sim3', type: 'new_order', message: `New order #MOCK-003 received.`, link: `/orders/MOCK-003`, timestamp: new Date(now.getTime() - 5*60000), read: false },
            ];
            setNotifications(mockNotifications);
            setUnreadCount(mockNotifications.filter(n => !n.read).length);
            // setLoadingNotifications(false); // Already handled if this block is reached
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        fetchAdminNotifications();
        const intervalId = setInterval(() => {
            if (isAuthenticated && user?.role === 'admin') { // Check again before fetching in interval
                fetchAdminNotifications();
            }
        }, 30000); // Poll every 30 seconds
        return () => clearInterval(intervalId);
    }, [fetchAdminNotifications, isAuthenticated, user]); // Add all dependencies

    const markAsRead = async (notificationId) => {
        const originalNotifications = [...notifications];
        const originalUnreadCount = unreadCount;
        const notificationToMark = originalNotifications.find(n => n._id === notificationId); // Use _id from MongoDB

        if (notificationToMark && !notificationToMark.read) {
            setNotifications(prev => prev.map(n => (n._id === notificationId ? { ...n, read: true } : n)));
            setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
        } else if (!notificationToMark) {
            console.warn(`[NotificationContext] markAsRead: Notification with ID ${notificationId} not found.`);
            return;
        }
        // If already read, no need to make API call or update state further
        if (notificationToMark && notificationToMark.read) return;


        try {
            await markAdminNotificationReadApi(notificationId); // API call uses the ID
            console.log(`[NotificationContext] Notification ${notificationId} marked as read on backend.`);
        } catch (error) {
            console.error(`Failed to mark notification ${notificationId} as read on backend:`, error);
            setNotifications(originalNotifications);
            setUnreadCount(originalUnreadCount);
            alert("Error updating notification status. Please try again.");
        }
    };

    const clearAllNotifications = async () => {
        const originalNotifications = [...notifications];
        const originalUnreadCount = unreadCount;
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        try {
            await markAllAdminNotificationsReadApi();
            console.log("[NotificationContext] All notifications marked as read on backend.");
        } catch (error) {
            console.error("Failed to mark all notifications as read on backend:", error);
            setNotifications(originalNotifications);
            setUnreadCount(originalUnreadCount);
            alert("Error marking all notifications as read. Please try again.");
        }
    };

    return (
        <AdminNotificationContext.Provider
            value={{ notifications, unreadCount, loadingNotifications, markAsRead, clearAllNotifications, fetchAdminNotifications }}
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