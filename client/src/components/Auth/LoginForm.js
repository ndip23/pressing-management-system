import React, { useState } from 'react';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { LogIn, Eye, EyeOff } from 'lucide-react'; 

const LoginForm = ({ onSubmit, isLoading, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); 

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit({ username, password });
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const passwordIcon = (
        showPassword ? (
            <EyeOff size={18} onClick={togglePasswordVisibility} className="cursor-pointer text-apple-gray-400 hover:text-apple-gray-600 dark:hover:text-apple-gray-200" />
        ) : (
            <Eye size={18} onClick={togglePasswordVisibility} className="cursor-pointer text-apple-gray-400 hover:text-apple-gray-600 dark:hover:text-apple-gray-200" />
        )
    );

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
                name="username"
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
                name="password"
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                suffixIcon={passwordIcon} 
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