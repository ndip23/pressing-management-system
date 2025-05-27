import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, UserCircle, Sun, Moon, Menu, Bell, Search } from 'lucide-react';
import Button from '../UI/Button';

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
    const { user, logout } = useAuth();
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    return (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-apple shadow-apple-sm">
            <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={toggleSidebar} className="p-1.5 mr-2 lg:hidden">
                        <Menu size={22} />
                    </Button>
                    <Link to="/" className="text-xl font-semibold text-apple-blue dark:text-apple-blue-light hidden sm:block">
                        PressFlow
                    </Link>
                </div>

                {/* Global Search (Optional) */}
                {/* <div className="flex-1 max-w-xs mx-4">
                    <Input
                        id="globalSearch"
                        placeholder="Search orders, customers..."
                        className="mb-0"
                        inputClassName="bg-apple-gray-100/70 dark:bg-apple-gray-800/70 border-transparent focus:bg-white dark:focus:bg-apple-gray-800 focus:border-apple-blue"
                        prefixIcon={<Search size={16}/>}
                    />
                </div> */}

                <div className="flex items-center space-x-3 sm:space-x-4">
                    <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="p-1.5">
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1.5 relative">
                        <Bell size={20} />
                        {/* Notification badge example */}
                        {/* <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white dark:ring-apple-gray-900 bg-apple-red" /> */}
                    </Button>

                    <div className="relative group">
                         <Button variant="ghost" size="sm" className="p-1 flex items-center space-x-1.5">
                            <UserCircle size={24} className="text-apple-gray-500 dark:text-apple-gray-400" />
                            <span className="hidden md:inline text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300">
                                {user?.username || 'User'}
                            </span>
                        </Button>
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-apple-gray-800 rounded-apple-md shadow-apple-lg py-1 origin-top-right opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 ease-apple z-50">
                            <div className="px-4 py-2 text-xs text-apple-gray-500 dark:text-apple-gray-400">
                                Signed in as <strong className="text-apple-gray-700 dark:text-apple-gray-200">{user?.username}</strong>
                            </div>
                            <div className="border-t border-apple-gray-200 dark:border-apple-gray-700 my-1"></div>
                            <Link to="/profile" className="block px-4 py-2 text-sm text-apple-gray-700 dark:text-apple-gray-200 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50">
                                My Profile
                            </Link>
                            <button
                                onClick={logout}
                                className="w-full text-left block px-4 py-2 text-sm text-apple-red hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
export default Navbar;