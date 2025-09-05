// client/src/pages/Admin/DirectoryAdminLoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDirectoryAuth } from '../../contexts/DirectoryAuthContext';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';

const DirectoryAdminLoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { dirAdminLogin, isDirAdminAuthenticated, loading: authLoading } = useDirectoryAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // This effect handles navigation AFTER the authentication state is confirmed to be true
    useEffect(() => {
        if (isDirAdminAuthenticated && !authLoading) {
            const from = location.state?.from?.pathname || "/directory-admin/dashboard";
            navigate(from, { replace: true });
        }
    }, [isDirAdminAuthenticated, authLoading, navigate, location.state]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await dirAdminLogin({ username, password });
            // DO NOT navigate here. The useEffect above will handle it.
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please check credentials.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show a spinner if the context is still doing its initial check OR if we are already logged in
    // and waiting for the useEffect to navigate.
    if (authLoading || isDirAdminAuthenticated) {
        return <div className="flex h-screen items-center justify-center bg-apple-gray-800"><Spinner size="lg" /></div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-apple-gray-800 p-4">
            <Card title="Directory Admin Login" className="w-full max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    <Input label="Username" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    <Input label="Password" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button type="submit" isLoading={isSubmitting} className="w-full">Login</Button>
                </form>
            </Card>
        </div>
    );
};

export default DirectoryAdminLoginPage;