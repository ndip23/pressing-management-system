// client/src/components/Layout/PublicLayout.js
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Button from '../UI/Button'; // Assuming your Button component is at this path
import { Package } from 'lucide-react'; // A generic icon for the logo

const PublicHeader = () => {
    const location = useLocation();

    // Helper to determine if a link is active, for styling
    const getLinkClass = (path) => {
        return location.pathname === path
            ? 'text-apple-blue font-bold'
            : 'text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue dark:hover:text-apple-blue-light';
    };

    return (
        <header className="sticky top-0 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-md z-50 shadow-apple-sm">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2">
                    <div className="bg-apple-blue rounded-lg p-1.5">
                        <Package size={24} className="text-white" />
                    </div>
                    <span className="text-xl font-bold text-apple-gray-800 dark:text-apple-gray-100">
                        PressFlow
                    </span>
                </Link>
                <div className="hidden md:flex space-x-6 items-center">
                    <Link to="/features" className={`text-sm font-medium transition-colors ${getLinkClass('/features')}`}>
                        Features
                    </Link>
                    <Link to="/pricing" className={`text-sm font-medium transition-colors ${getLinkClass('/pricing')}`}>
                        Pricing
                    </Link>
                </div>
                <div className="space-x-2 sm:space-x-4 flex items-center">
                    <Link to="/login" className="text-sm font-medium text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue dark:hover:text-apple-blue-light transition-colors">
                        Log In
                    </Link>
                    <Link to="/signup">
                        <Button variant="primary" size="md">Sign Up Free</Button>
                    </Link>
                </div>
            </nav>
        </header>
    );
};

const PublicFooter = () => (
    <footer className="bg-apple-gray-100 dark:bg-black/20">
        <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                <div>
                    <Link to="/" className="flex items-center justify-center md:justify-start space-x-2 mb-4 md:mb-0">
                        <div className="bg-apple-blue rounded-lg p-1.5">
                            <Package size={24} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-apple-gray-800 dark:text-apple-gray-100">
                            PressFlow
                        </span>
                    </Link>
                </div>
                <div className="text-sm text-apple-gray-500 dark:text-apple-gray-400">
                    <div className="mt-4 md:mt-0 space-x-6">
                        <Link to="#" className="hover:text-apple-blue">Privacy Policy</Link>
                        <Link to="#" className="hover:text-apple-blue">Terms of Service</Link>
                        <Link to="#" className="hover:text-apple-blue">Contact</Link>
                    </div>
                </div>
            </div>
            <div className="mt-6 pt-6 border-t border-apple-gray-200 dark:border-apple-gray-800 text-center text-xs text-apple-gray-500 dark:text-apple-gray-400">
                <p>© {new Date().getFullYear()} PressFlow. All Rights Reserved.</p>
            </div>
        </div>
    </footer>
);


const PublicLayout = () => {
    return (
        <div className="bg-apple-gray-50 dark:bg-apple-gray-950 min-h-screen flex flex-col antialiased">
            <PublicHeader />
            <main className="flex-grow">
                {/* 
                  The Outlet component is a placeholder provided by react-router-dom. 
                  It will render the matched child route component defined in App.js.
                  For example, if the user is at '/', it renders <LandingPage /> here.
                  If at '/features', it renders <FeaturesPage /> here.
                */}
                <Outlet />
            </main>
            <PublicFooter />
        </div>
    );
};

export default PublicLayout;