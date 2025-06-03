// client/src/components/Layout/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminNotifications } from '../../contexts/NotificationContext';
import { Bell, UserCircle, PlusCircle, Sun, Moon, Menu, AlertTriangle, LogOut, Search as SearchIcon, Settings as SettingsIconLucide, XCircle } from 'lucide-react'; // Added necessary icons
import Button from '../UI/Button';
import { formatDistanceToNowStrict } from 'date-fns'; // Use Strict for cleaner output

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, clearAllNotifications } = useAdminNotifications();
    const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('darkMode')) || false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const notificationRef = useRef(null);
    const userMenuRef = useRef(null);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(!darkMode);

    // Close dropdowns if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const getIconForNotification = (type) => {
        switch (type) {
            case 'overdue_warning': return <AlertTriangle size={16} className="text-orange-500 mr-2 flex-shrink-0" />;
            case 'overdue_alert': return <AlertTriangle size={16} className="text-red-600 mr-2 flex-shrink-0" />;
            case 'new_order': return <PlusCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />; // Assuming PlusCircle for new order
            default: return <Bell size={16} className="text-apple-gray-500 mr-2 flex-shrink-0" />;
        }
    };


    return (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-apple shadow-apple-sm">
            <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={toggleSidebar} className="p-1.5 mr-2 lg:hidden" aria-label="Toggle Sidebar">
                        <Menu size={22} />
                    </Button>
                    <Link to="/" className="text-xl font-semibold text-apple-blue dark:text-apple-blue-light hidden sm:block">PressFlow</Link>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3">
                    <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="p-1.5" aria-label="Toggle Dark Mode">
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </Button>

                    {/* Notifications Bell and Dropdown */}
                    {user?.role === 'admin' && ( // Only show bell for admins
                        <div className="relative" ref={notificationRef}>
                            <Button variant="ghost" size="sm" onClick={() => setShowNotifications(!showNotifications)} className="p-1.5" aria-label="View Notifications">
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
                                        <h3 className="font-semibold text-apple-gray-800 dark:text-apple-gray-100">Notifications</h3>
                                        {notifications.length > 0 && (
                                            <Button variant="link" size="sm" onClick={() => { clearAllNotifications(); setShowNotifications(false);}} className="text-xs">Mark all as read</Button>
                                        )}
                                    </div>
                                    <div className="overflow-y-auto flex-grow custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400 text-center py-8 px-3">No new notifications.</p>
                                        ) : (
                                            notifications.map(notif => (
                                                <Link
                                                    to={notif.link || '#!'} // Use #! for non-navigable links
                                                    key={notif.id}
                                                    onClick={(e) => {
                                                        if (!notif.link || notif.link === '#!') e.preventDefault(); // Prevent navigation for placeholder links
                                                        if (!notif.read) markAsRead(notif.id);
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
                                                                {formatDistanceToNowStrict(new Date(notif.timestamp), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                    {/* <div className="p-2 border-t border-apple-gray-200 dark:border-apple-gray-700 text-center">
                                        <Link to="/all-notifications" onClick={() => setShowNotifications(false)} className="text-xs text-apple-blue hover:underline">View All Notifications</Link>
                                    </div> */}
                                </div>
                            )}
                        </div>
                    )}

                    {/* User Profile Dropdown */}
                    <div className="relative" ref={userMenuRef}>
                         <Button variant="ghost" size="sm" onClick={() => setShowUserMenu(!showUserMenu)} className="p-1 flex items-center space-x-1.5" aria-label="Open User Menu">
                            <UserCircle size={24} className="text-apple-gray-500 dark:text-apple-gray-400" />
                            <span className="hidden md:inline text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300">
                                {user?.username || 'User'}
                            </span>
                        </Button>
                        {showUserMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-apple-gray-800 rounded-apple-md shadow-apple-lg py-1 origin-top-right z-50 border border-apple-gray-200 dark:border-apple-gray-700">
                                <div className="px-4 py-3">
                                    <p className="text-sm text-apple-gray-800 dark:text-apple-gray-100">Signed in as</p>
                                    <p className="text-sm font-medium text-apple-gray-900 dark:text-apple-gray-50 truncate">{user?.username}</p>
                                </div>
                                <div className="border-t border-apple-gray-200 dark:border-apple-gray-700"></div>
                                <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center px-4 py-2 text-sm text-apple-gray-700 dark:text-apple-gray-200 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50">
                                    <UserCircle size={16} className="mr-2"/> My Profile
                                </Link>
                                {user?.role === 'admin' && (
                                <Link to="/admin/settings" onClick={() => setShowUserMenu(false)} className="flex items-center px-4 py-2 text-sm text-apple-gray-700 dark:text-apple-gray-200 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50">
                                    <SettingsIconLucide size={16} className="mr-2"/> Settings
                                </Link>
                                )}
                                <div className="border-t border-apple-gray-200 dark:border-apple-gray-700"></div>
                                <button
                                    onClick={() => { logout(); setShowUserMenu(false); }}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-apple-red hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50"
                                >
                                    <LogOut size={16} className="mr-2"/> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};
export default Navbar;