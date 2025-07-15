import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../UI/Button'; // Your UI Button

const DirectoryHeader = () => (
    <header className="bg-white dark:bg-apple-gray-900 shadow-sm">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
            <Link to="/directory" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-apple-blue" /* ... */ />
                <span className="text-xl font-bold">PressFlow Directory</span>
            </Link>
            {/* Link back to the main product website */}
            <Link to="/">
                <Button variant="ghost" size="sm">Powered by PressFlow</Button>
            </Link>
        </nav>
    </header>
);