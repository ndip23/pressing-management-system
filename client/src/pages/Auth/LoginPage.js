// client/src/pages/Auth/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Added Link
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import LoginForm from '../../components/Auth/LoginForm';
import { Package } from 'lucide-react';
import Spinner from '../../components/UI/Spinner';

const LoginPage = () => {
    const [formError, setFormError] = useState('');
    const [isFormLoading, setIsFormLoading] = useState(false);
    const { login, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/app/dashboard";

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate, from]);

    const handleLoginSubmit = async (credentials) => {
        setFormError('');
        setIsFormLoading(true);
        try {
            await login(credentials.username, credentials.password);
            // Successful login will trigger useEffect to navigate
        } catch (err) {
            // err should be the error object from AuthContext, which includes message
            setFormError(err.message || 'Failed to login. Please check your credentials.');
        } finally {
            setIsFormLoading(false);
        }
    };

    // This loading is for the initial auth check when the app loads/refreshes
    if (authLoading && !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950 p-4">
                <Spinner size="lg" />
            </div>
        );
    }

    // If already authenticated (e.g., user navigated back to /login), redirect
    if (isAuthenticated) {
         return (
            <div className="min-h-screen flex items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950 p-4">
                <p className="text-apple-gray-700 dark:text-apple-gray-300">Already logged in. Redirecting...</p>
                {/* Optional: Add a manual redirect button if useEffect fails for some reason */}
                {/* <Button onClick={() => navigate(from, { replace: true })} className="mt-2">Go to Dashboard</Button> */}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950 p-4">
            <div className="flex items-center mb-8">
                <Package size={48} className="text-apple-blue mr-3" />
                <h1 className="text-4xl font-bold text-apple-gray-800 dark:text-apple-gray-100">
                    Press<span className="text-apple-blue">Flow</span>
                </h1>
            </div>
            <Card className="w-full max-w-sm shadow-apple-lg">
                <div className="p-6 sm:p-8">
                    <h2 className="text-2xl font-semibold text-center text-apple-gray-900 dark:text-apple-gray-100 mb-6">
                        Login
                    </h2>
                    <LoginForm
                        onSubmit={handleLoginSubmit}
                        isLoading={isFormLoading}
                        error={formError}
                    />
                </div>
            </Card>
            <p className="mt-8 text-center text-xs text-apple-gray-500 dark:text-apple-gray-400">
                © {new Date().getFullYear()} PressFlow. All rights reserved.
            </p>
        </div>
    );
};

export default LoginPage;