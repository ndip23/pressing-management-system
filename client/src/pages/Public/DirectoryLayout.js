// client/src/pages/Public/DirectoryLayout.js
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
// No Button import is needed as this is a lean layout component

// --- Reusable Public Header for the Directory Site ---
export const DirectoryHeader = () => {
    // Using a hook to apply different styles to active links
    const location = useLocation();

    const getLinkClass = (path) => {
        const baseClass = "text-sm font-medium hover:text-apple-blue dark:hover:text-sky-300 transition-colors";
        const activeClass = "text-apple-blue dark:text-sky-400 font-semibold";
        // Check for exact match for directory, otherwise check startsWith for nested routes
        const isActive = path === '/directory' ? location.pathname === path : location.pathname.startsWith(path);
        return `${baseClass} ${isActive ? activeClass : 'text-apple-gray-600 dark:text-apple-gray-300'}`;
    };

    return (
        <header className="sticky top-0 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-md z-50 shadow-apple-sm">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/directory" className="flex items-center space-x-2">
                    <svg className="h-8 w-8 text-apple-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-xl font-bold text-apple-gray-800 dark:text-apple-gray-100">PressFlow Directory</span>
                </Link>

                {/* Main navigation for the directory site */}
                <div className="hidden md:flex space-x-8 items-center">
                    <Link to="/directory" className={getLinkClass('/directory')}>Find a Service</Link>
                    <Link to="/" className={getLinkClass('/')}>Get The Software</Link>
                    {/* <Link to="/about" className={getLinkClass('/about')}>About</Link> */}
                </div>

                {/* This div keeps the nav balanced. Could add a "List your business" button here someday. */}
                <div className="w-24 flex justify-end">
                    {/* Placeholder */}
                </div>
            </nav>
        </header>
    );
};

// --- Reusable Public Footer for the Directory Site (with blue background) ---
export const DirectoryFooter = () => (
    <footer className="bg-apple-blue text-white">
        <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                {/* About Section */}
                <div>
                    <h4 className="font-bold text-lg mb-3">PressFlow Directory</h4>
                    <p className="text-sm text-sky-200 leading-relaxed">
                        Our mission is to connect you with reliable, high-quality pressing and laundry services in your area that are powered by modern technology.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="md:mx-auto">
                    <h4 className="font-bold text-lg mb-3">Quick Links</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/directory" className="text-sky-200 hover:text-white hover:underline">Search Directory</Link></li>
                        <li><Link to="/" className="text-sky-200 hover:text-white hover:underline">Get The Software</Link></li>
                        <li><Link to="/features" className="text-sky-200 hover:text-white hover:underline">Software Features</Link></li>
                    </ul>
                </div>

                {/* Legal & Admin */}
                <div className="md:text-right">
                    <h4 className="font-bold text-lg mb-3">Resources</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/privacy" className="text-sky-200 hover:text-white hover:underline">Privacy Policy</Link></li>
                        <li><Link to="/terms" className="text-sky-200 hover:text-white hover:underline">Terms of Service</Link></li>
                        <li><Link to="/contact" className="text-sky-200 hover:text-white hover:underline">Contact Us</Link></li>
                    </ul>
                </div>
            </div>

            {/* Discreet Admin Login Link */}
            <div className="mt-10 pt-6 border-t border-sky-700 text-center text-xs text-sky-300">
                <p>&copy; {new Date().getFullYear()} PressFlow. All Rights Reserved.</p>
                <Link to="/directory-admin/login" className="mt-2 inline-block hover:text-white hover:underline">
                    Admin Portal
                </Link>
            </div>
        </div>
    </footer>
);


// --- The Main Layout Component that uses the Header and Footer ---
const DirectoryLayout = () => {
    return (
        <div className="bg-apple-gray-100 dark:bg-apple-gray-950 min-h-screen flex flex-col">
            <DirectoryHeader />
            <main className="flex-grow">
                {/* This Outlet component is provided by react-router-dom. It will render the specific
                    child route component (e.g., DirectoryPage or BusinessProfilePage) that matches the URL. */}
                <Outlet />
            </main>
            <DirectoryFooter />
        </div>
    );
};

export default DirectoryLayout;