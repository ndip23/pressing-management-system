// client/src/components/Layout/DirectoryHeader.js
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../UI/Button'; // Assuming your Button is here

const DirectoryHeader = () => (
    <header className="bg-white dark:bg-apple-gray-900 shadow-sm sticky top-0 z-30">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
            <Link to="/directory" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-apple-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span className="text-xl font-bold text-apple-gray-800 dark:text-apple-gray-100">PressFlow Directory</span>
            </Link>
            {/* This link takes users from the directory back to the main marketing/landing page */}
            <Link to="/">
                <Button variant="ghost" size="sm">Powered by PressFlow</Button>
            </Link>
        </nav>
    </header>
);

export default DirectoryHeader; 