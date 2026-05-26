// client/src/contexts/NotificationContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
    fetchAdminNotificationsApi,
    markAdminNotificationReadApi,
    markAllAdminNotificationsReadApi
} from '../services/api';

const POLL_INTERVAL_MS = 90000;
const APP_ROUTE_PREFIX = '/app';

const AdminNotificationContext = createContext(null);

export const AdminNotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const fetchingRef = useRef(false);
    const isAppRoute = location.pathname.startsWith(APP_ROUTE_PREFIX);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated || !isAppRoute) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        setLoadingNotifications(true);
        try {
            const { data } = await fetchAdminNotificationsApi();
            const processedNotifications = (data.notifications || []).map(n => ({
                ...n,
                timestamp: new Date(n.createdAt || n.timestamp || Date.now())
            }));
            setNotifications(processedNotifications);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error("Failed to fetch notifications:", error.response?.data?.message || error.message);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoadingNotifications(false);
            fetchingRef.current = false;
        }
    }, [isAuthenticated, isAppRoute]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (!isAuthenticated || !isAppRoute) return undefined;

        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchNotifications();
            }
        }, POLL_INTERVAL_MS);

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchNotifications();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [isAuthenticated, isAppRoute, fetchNotifications]);

    const markAsRead = async (notificationId) => {
        const originalNotifications = [...notifications];
        const notificationToMark = originalNotifications.find(n => n._id === notificationId);

        if (notificationToMark && !notificationToMark.read) {
            setNotifications(prev => prev.map(n => (n._id === notificationId ? { ...n, read: true } : n)));
            setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
        } else {
            return;
        }

        try {
            const { data } = await markAdminNotificationReadApi(notificationId);
            if (typeof data.unreadCount === 'number') {
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error(`Failed to mark notification ${notificationId} as read:`, error);
            setNotifications(originalNotifications);
            setUnreadCount(originalNotifications.filter(n => !n.read).length);
        }
    };

    const clearAllNotifications = async () => {
        const originalNotifications = notifications.map(n => ({...n}));
        const originalUnreadCount = unreadCount;

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            await markAllAdminNotificationsReadApi();
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
            setNotifications(originalNotifications);
            setUnreadCount(originalUnreadCount);
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
                fetchNotifications,
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
