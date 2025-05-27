// client/src/components/Auth/LoginForm.js
import React, { useState } from 'react';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { LogIn } from 'lucide-react';

const LoginForm = ({ onSubmit, isLoading, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit({ username, password });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-apple">
                    <p className="text-sm text-apple-red dark:text-red-300">{error}</p>
                </div>
            )}
            <Input
                label="Username"
                id="username"
                name="username" // Important for form handling if you use a form library
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="e.g., admin or staff"
                autoComplete="username"
                disabled={isLoading}
            />
            <Input
                label="Password"
                id="password"
                name="password" // Important for form handling
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
            />
            <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
                iconLeft={<LogIn size={18} />}
            >
                {isLoading ? 'Logging in...' : 'Login'}
            </Button>
        </form>
    );
};

export default LoginForm;