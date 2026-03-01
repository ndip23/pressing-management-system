// client/src/components/Layout/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminNotifications } from '../../contexts/NotificationContext';
import {
    Bell, Menu, AlertTriangle,
    PlusCircle
} from 'lucide-react';
import Button from '../UI/Button';
import LanguageSwitcher from '../UI/LanguageSwitcher';
import UserMenu from '../UI/UserMenu';
import ThemeToggle from '../UI/ThemeToggle';
import { formatDistanceToNowStrict, isValid as isValidDate } from 'date-fns';

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const { notifications, unreadCount, markAsRead, clearAllNotifications, loadingNotifications } = useAdminNotifications();
    const [showNotifications, setShowNotifications] = useState(false);

    const notificationRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setShowNotifications(prevShow => !prevShow);
    };

    const getIconForNotification = (type) => {
        switch (type) {
            case 'overdue_warning': return <AlertTriangle size={16} className="text-orange-500 mr-2 flex-shrink-0" />;
            case 'overdue_alert': return <AlertTriangle size={16} className="text-red-600 mr-2 flex-shrink-0" />;
            case 'new_order': return <PlusCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />;
            default: return <Bell size={16} className="text-apple-gray-500 mr-2 flex-shrink-0" />;
        }
    };

    return (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-apple shadow-apple-sm">
            <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={toggleSidebar} className="p-1.5 mr-2 lg:hidden" aria-label={t('navbar.toggleSidebar')}>
                        <Menu size={22} />
                    </Button>
                    <Link to="/" className="flex items-center space-x-2">
                    <img src="/logo.png" alt="PressFlow Logo" className="h-8 w-auto" />
                    <span className="text-xl font-bold text-apple-gray-800 dark:text-apple-gray-100">PressMark</span>
                </Link>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3">
                    <LanguageSwitcher />

                    <ThemeToggle />

                    {isAuthenticated && (
                        <div className="relative" ref={notificationRef}>
                            <Button variant="ghost" size="sm" onClick={handleBellClick} className="p-1.5" aria-label={t('navbar.viewNotifications')} aria-expanded={showNotifications}>
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2">
                                        <span className="absolute inline-flex h-full w-full rounded-full bg-apple-red opacity-75 animate-ping"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-apple-red text-white text-[10px] items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    </span>
                                )}
                            </Button>
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-apple-gray-800 rounded-apple-lg shadow-apple-xl border border-apple-gray-200 dark:border-apple-gray-700 origin-top-right z-50 max-h-[calc(100vh-100px)] flex flex-col">
                                    <div className="flex justify-between items-center p-3 border-b border-apple-gray-200 dark:border-apple-gray-700">
                                        <h3 className="font-semibold text-apple-gray-800 dark:text-apple-gray-100">{t('navbar.notifications.title')}</h3>
                                        {notifications.length > 0 && (<Button variant="link" size="sm" onClick={() => { clearAllNotifications(); /* setShowNotifications(false); Optional: keep open */ }} className="text-xs">{t('navbar.notifications.markAllRead')}</Button>)}
                                    </div>
                                    <div className="overflow-y-auto flex-grow custom-scrollbar">
                                        {loadingNotifications && <div className="p-4 text-center text-sm text-apple-gray-500">{t('navbar.notifications.loading')}</div>}
                                        {!loadingNotifications && notifications.length === 0 && (<p className="text-sm text-apple-gray-500 dark:text-apple-gray-400 text-center py-8 px-3">{t('navbar.notifications.noNotifications')}</p>)}
                                        {!loadingNotifications && notifications.map(notif => {
                                            const dateToFormat = new Date(notif.timestamp);
                                            const isValidTimestamp = notif.timestamp && isValidDate(dateToFormat);
                                            return (
                                                <Link
                                                    to={notif.link || '#!'}
                                                    key={notif._id || notif.id}
                                                    onClick={(e) => {
                                                        if (!notif.link || notif.link === '#!') e.preventDefault();
                                                        if (!notif.read) markAsRead(notif._id || notif.id);
                                                        if (notif.link && notif.link !== '#!') setShowNotifications(false);
                                                    }}
                                                    className={`block hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50 border-b border-apple-gray-100 dark:border-apple-gray-700/50 last:border-b-0 ${!notif.read ? 'bg-sky-50 dark:bg-sky-900/30' : ''}`}
                                                >
                                                    <div className="p-3 flex items-start">
                                                        {getIconForNotification(notif.type)}
                                                        <div className="flex-1">
                                                            <p className={`text-sm ${!notif.read ? 'font-semibold text-apple-gray-900 dark:text-apple-gray-100' : 'text-apple-gray-700 dark:text-apple-gray-300'}`}>
                                                                {notif.message}
                                                            </p>
                                                            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 mt-0.5">
                                                                {isValidTimestamp ? formatDistanceToNowStrict(dateToFormat, { addSuffix: true }) : t('navbar.notifications.recently')}
                                                            </p>
                                                        </div>
                                                        {!notif.read && <span className="ml-2 mt-1 h-2 w-2 bg-apple-blue rounded-full flex-shrink-0"></span>}
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <UserMenu
                        onMenuClose={() => setShowNotifications(false)}
                    />
                </div>
            </div>
        </header>
    );
};
export default Navbar;