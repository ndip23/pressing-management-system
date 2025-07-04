// client/src/components/Layout/PublicLayout.js
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Package } from 'lucide-react'; // Your app icon

// Public Header Component
const PublicHeader = () => (
    <header className="absolute top-0 left-0 w-full z-30 bg-transparent">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
                <Package size={32} className="text-apple-blue" />
                <span className="text-2xl font-bold text-apple-gray-800 dark:text-white">
                    Press<span className="text-apple-blue">Flow</span>
                </span>
            </Link>
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
                <Link to="/features" className="text-sm font-medium text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue dark:hover:text-white">Features</Link>
                <Link to="/pricing" className="text-sm font-medium text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue dark:hover:text-white">Pricing</Link>
                <Link to="/login" className="text-sm font-medium text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue dark:hover:text-white">Log In</Link>
                <Link to="/signup" className="bg-apple-blue text-white px-4 py-2 rounded-apple text-sm font-semibold hover:bg-sky-600 transition-colors">
                    Sign Up Free
                </Link>
            </nav>
            {/* Mobile menu button could be added here */}
        </div>
    </header>
);

// Public Footer Component
const PublicFooter = () => (
    <footer className="bg-apple-gray-100 dark:bg-apple-gray-900 border-t border-apple-gray-200 dark:border-apple-gray-800">
        <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-center md:text-left mb-4 md:mb-0">
                    <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">© {new Date().getFullYear()} PressFlow. All rights reserved.</p>
                </div>
                <div className="flex space-x-6">
                    <Link to="/privacy-policy" className="text-sm text-apple-gray-500 hover:text-apple-blue dark:hover:text-white">Privacy Policy</Link>
                    <Link to="/terms-of-service" className="text-sm text-apple-gray-500 hover:text-apple-blue dark:hover:text-white">Terms of Service</Link>
                </div>
            </div>
        </div>
    </footer>
);


const PublicLayout = () => {
    // A simple wrapper that includes a public header and footer
    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-apple-gray-950">
            <PublicHeader />
            <main className="flex-grow">
                <Outlet /> {/* This is where the specific public page (e.g., LandingPage) will be rendered */}
            </main>
            <PublicFooter />
        </div>
    );
};

export default PublicLayout;