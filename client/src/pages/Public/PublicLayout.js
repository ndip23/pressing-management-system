// client/src/pages/Public/PublicLayout.js
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Button from '../../components/UI/Button';

// --- Reusable Public Header Component ---
export const PublicHeader = () => (
    <header className="sticky top-0 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-md z-50 shadow-apple-sm">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-apple-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span className="text-xl font-bold text-apple-gray-800 dark:text-apple-gray-100">PressFlow</span>
            </Link>
            <div className="hidden md:flex space-x-6 items-center">
                <Link to="/" className="text-sm font-medium hover:text-apple-blue transition-colors">Home</Link>
                <Link to="/features" className="text-sm font-medium hover:text-apple-blue transition-colors">Features</Link>
                <Link to="/pricing" className="text-sm font-medium hover:text-apple-blue transition-colors">Pricing</Link>
                <Link to="/directory" className="text-sm font-medium hover:text-apple-blue transition-colors">Directory</Link>
            </div>
            <div className="space-x-4 flex items-center">
                <Link to="/login" className="text-sm font-medium hover:text-apple-blue transition-colors">Login</Link>
                <Link to="/signup">
                    <Button variant="primary" size="md">Get Started</Button>
                </Link>
            </div>
        </nav>
    </header>
);

// --- Reusable Public Footer Component ---
export const PublicFooter = () => (
    <footer className="bg-apple-gray-100 dark:bg-black/20">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-apple-gray-500 dark:text-apple-gray-400">
            <p>&copy; {new Date().getFullYear()} PressFlow. All Rights Reserved.</p>
            <div className="mt-4 space-x-6">
                <Link to="/privacy" className="hover:text-apple-blue">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-apple-blue">Terms of Service</Link>
                <Link to="/contact" className="hover:text-apple-blue">Contact</Link>
            </div>
        </div>
    </footer>
);


// --- Main Layout Component ---
const PublicLayout = () => {
    return (
        <div className="bg-apple-gray-50 dark:bg-apple-gray-950 min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-grow">
                <Outlet /> {/* This is where the specific page content will be rendered */}
            </main>
            <PublicFooter />
        </div>
    );
};

export default PublicLayout;