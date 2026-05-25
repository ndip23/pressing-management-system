// client/src/components/UI/UserMenu.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircle, Settings, LogOut, CirclePlay } from 'lucide-react';
import Button from './Button';
import { useAppTour } from '../../contexts/AppTourContext';

const UserMenu = ({ 
    className = "", 
    variant = "default", // "default" | "compact"
    onMenuClose = () => {} 
}) => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { startTour, isAvailable: isTourAvailable } = useAppTour();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleUserMenuClick = () => {
        setShowUserMenu(prevShow => !prevShow);
        onMenuClose(); // Close other menus (like notifications)
    };

    const handleMenuItemClick = () => {
        setShowUserMenu(false);
    };

    const handleLogout = () => {
        logout();
        setShowUserMenu(false);
    };

    // Compact variant for mobile/simplified use
    if (variant === "compact") {
        return (
            <div className={`${className}`}>
                <div className="space-y-3">
                    <div className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400 text-center">
                        {t('navbar.userMenu.signedInAs')} {user?.username}
                    </div>
                    <Link 
                        to="/app/dashboard" 
                        className="block w-full"
                        onClick={handleMenuItemClick}
                    >
                        <Button variant="primary" size="lg" className="w-full justify-center">
                            <Settings size={16} className="mr-2" />
                            {t('sidebar.navigation.dashboard')}
                        </Button>
                    </Link>
                    <Link 
                        to="/app/profile" 
                        className="block w-full"
                        onClick={handleMenuItemClick}
                    >
                        <Button variant="secondary" size="lg" className="w-full justify-center">
                            <UserCircle size={16} className="mr-2" />
                            {t('navbar.userMenu.myProfile')}
                        </Button>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full"
                    >
                        <Button variant="ghost" size="lg" className="w-full justify-center text-apple-red hover:bg-red-50 dark:hover:bg-red-900/20">
                            <LogOut size={16} className="mr-2" />
                            {t('navbar.userMenu.logout')}
                        </Button>
                    </button>
                </div>
            </div>
        );
    }

    // Default dropdown variant
    return (
        <div className={`relative ${className}`} ref={userMenuRef}>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleUserMenuClick} 
                className="p-1 flex items-center space-x-1.5" 
                aria-label={t('navbar.openUserMenu')} 
                aria-expanded={showUserMenu}
            >
                {user?.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                    <UserCircle size={24} className="text-apple-gray-500 dark:text-apple-gray-400" />
                )}
                <span className="hidden md:inline text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300">
                    {user?.username || 'User'}
                </span>
            </Button>
            
            {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-apple-gray-800 rounded-apple-md shadow-apple-lg py-1 origin-top-right z-50 border border-apple-gray-200 dark:border-apple-gray-700">
                    <div className="px-4 py-3">
                        <span className="text-sm text-apple-gray-700 dark:text-apple-gray-200">
                            {t('navbar.userMenu.signedInAs')} 
                        </span>
                        <span className="text-sm font-semibold text-apple-gray-900 dark:text-apple-gray-50 truncate">
                              {user?.username}
                        </span>
                        <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400 capitalize">
                            {t('navbar.userMenu.role', { role: user?.role })}
                        </p>
                    </div>
                    
                    <div className="border-t border-apple-gray-200 dark:border-apple-gray-700"></div>
                    
                    <Link 
                        to="/app/profile" 
                        onClick={handleMenuItemClick} 
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-apple-gray-700 dark:text-apple-gray-200 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50"
                    >
                        <UserCircle size={16} className="mr-2 text-apple-gray-500" /> 
                        {t('navbar.userMenu.myProfile')}
                    </Link>
                    
                    <Link 
                        to="/app/dashboard" 
                        onClick={handleMenuItemClick} 
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-apple-gray-700 dark:text-apple-gray-200 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50"
                    >
                        <Settings size={16} className="mr-2 text-apple-gray-500" /> 
                        {t('sidebar.navigation.dashboard')}
                    </Link>

                    {isTourAvailable && (
                        <button
                            type="button"
                            onClick={() => {
                                startTour();
                                handleMenuItemClick();
                            }}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-apple-gray-700 dark:text-apple-gray-200 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50"
                        >
                            <CirclePlay size={16} className="mr-2 text-apple-blue" />
                            {t('sidebar.help.takeTour')}
                        </button>
                    )}

                    {user?.role === 'admin' && (
                        <Link 
                            to="/app/admin/settings" 
                            onClick={handleMenuItemClick} 
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-apple-gray-700 dark:text-apple-gray-200 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50"
                        >
                            <Settings size={16} className="mr-2 text-apple-gray-500" /> 
                            {t('navbar.userMenu.appSettings')}
                        </Link>
                    )}
                    
                    <div className="border-t border-apple-gray-200 dark:border-apple-gray-700"></div>
                    
                    <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-apple-red hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50"
                    >
                        <LogOut size={16} className="mr-2" /> 
                        {t('navbar.userMenu.logout')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
