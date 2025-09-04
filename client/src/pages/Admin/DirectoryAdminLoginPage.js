// client/src/pages/Admin/DirectoryAdminLoginPage.js
import React, {useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDirectoryAuth } from '../../contexts/DirectoryAuthContext'; // Use the new context
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
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (isDirAdminAuthenticated && !authLoading) {
            const from = location.state?.from?.pathname || "/directory-admin/dashboard";
            navigate(from, { replace: true });
        }
    }, [isDirAdminAuthenticated, authLoading, navigate, location.state]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await dirAdminLogin({ username, password });
            // The useEffect above will handle navigation
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please check credentials.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Show a spinner if the context is still checking auth or if already logged in and redirecting
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
                    <Button type="submit" isLoading={isLoading} className="w-full">Login</Button>
                </form>
            </Card>
        </div>
    );
};

export default DirectoryAdminLoginPage;