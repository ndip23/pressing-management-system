// client/src/pages/Auth/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import LoginForm from '../../components/Auth/LoginForm';
import { Package, ArrowLeft } from 'lucide-react';
import Spinner from '../../components/UI/Spinner';

const LoginPage = () => {
    const { t, i18n } = useTranslation();
    const [formError, setFormError] = useState('');
    const [isFormLoading, setIsFormLoading] = useState(false);
    const { login, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // CHANGE: Set the default destination explicitly to the dashboard path.
    // If you want to ALWAYS go to dashboard and ignore previous pages, 
    // just use: const destination = "/app/dashboard";
    const destination = location.state?.from?.pathname?.includes('profile') 
        ? "/app/dashboard" 
        : (location.state?.from?.pathname || "/app/dashboard");

    useEffect(() => {
        // Force language to English on login page
        if (i18n.language !== 'en') {
            i18n.changeLanguage('en');
            localStorage.setItem('i18nextLng', 'en');
        }
    }, [i18n]);

    useEffect(() => {
        // When authenticated, navigate to the dashboard destination
        if (isAuthenticated && !authLoading) {
            navigate(destination, { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate, destination]);

    const handleLoginSubmit = async (credentials) => {
        setFormError('');
        setIsFormLoading(true);
        try {
            await login(credentials.username, credentials.password);
        } catch (err) {
            setFormError(err.message || t('login.loginFailed'));
        } finally {
            setIsFormLoading(false);
        }
    };

    if (authLoading && !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950 p-4">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isAuthenticated) {
         return (
            <div className="min-h-screen flex items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950 p-4">
                <div className="text-center">
                    <p className="text-apple-gray-700 dark:text-apple-gray-300 mb-4">{t('login.alreadyLoggedIn')}</p>
                    <button 
                        onClick={() => navigate("/app/dashboard", { replace: true })}
                        className="px-4 py-2 bg-apple-blue text-white rounded-lg"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950 p-4">
            <div className="absolute top-6 left-6">
                <Link 
                    to="/directory" 
                    className="flex items-center space-x-2 text-apple-gray-600 dark:text-apple-gray-400 hover:text-apple-blue dark:hover:text-apple-blue transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">{t('public.header.home')}</span>
                </Link>
            </div>

            <div className="flex items-center mb-8">
                <Package size={48} className="text-apple-blue mr-3" />
                <h1 className="text-4xl font-bold text-apple-gray-800 dark:text-apple-gray-100">
                    Press<span className="text-apple-blue">Mark</span>
                </h1>
            </div>
            <Card className="w-full max-w-sm shadow-apple-lg">
                <div className="p-6 sm:p-8">
                    <h2 className="text-2xl font-semibold text-center text-apple-gray-900 dark:text-apple-gray-100 mb-6">
                        {t('login.pageTitle')}
                    </h2>
                    <LoginForm
                        onSubmit={handleLoginSubmit}
                        isLoading={isFormLoading}
                        error={formError}
                    />
                </div>
            </Card>
            <p className="mt-8 text-center text-xs text-apple-gray-500 dark:text-apple-gray-400">
                © {new Date().getFullYear()} lsmbooker. {t('login.copyright')}
            </p>
        </div>
    );
};

export default LoginPage;