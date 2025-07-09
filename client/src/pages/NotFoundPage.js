import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/UI/Button';
import { AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950 p-4 text-center">
            <AlertTriangle size={64} className="text-apple-yellow mb-6" />
            <h1 className="text-5xl font-bold text-apple-gray-800 dark:text-apple-gray-100 mb-2">404</h1>
            <p className="text-xl text-apple-gray-600 dark:text-apple-gray-300 mb-6">
                Oops! The page you're looking for doesn't exist.
            </p>
            <Link to="/app/">
                <Button variant="primary" size="lg">
                    Go Back to Dashboard
                </Button>
            </Link>
            <p className="mt-12 text-xs text-apple-gray-500 dark:text-apple-gray-400">
                If you think this is an error, please contact support.
            </p>
        </div>
    );
};

export default NotFoundPage;