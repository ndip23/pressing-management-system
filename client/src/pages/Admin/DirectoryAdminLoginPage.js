// client/src/pages/Admin/DirectoryAdminLoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginDirectoryAdminApi } from '../../services/api'; // Add this to api.js
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';

const DirectoryAdminLoginPage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const { data } = await loginDirectoryAdminApi({ username, password });
            // Store this separate token in localStorage with a different key
            localStorage.setItem('directoryAdminToken', data.token);
            navigate('/directory-admin/dashboard'); // Navigate to the management page
        } catch (err) {
            setError(err.response?.data?.message || "Login failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-apple-gray-700 p-4">
            <Card title="Directory Admin Login" className="w-full max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <p className="text-red-500">{error}</p>}
                    <Input label="Username" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    <Input label="Password" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button type="submit" isLoading={isLoading} className="w-full">Login</Button>
                </form>
            </Card>
        </div>
    );
};

export default DirectoryAdminLoginPage;