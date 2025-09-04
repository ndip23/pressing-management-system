// client/src/components/Auth/DirectoryAdminRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useDirectoryAuth } from '../../contexts/DirectoryAuthContext'; // Use the new context
import Spinner from '../UI/Spinner';

const DirectoryAdminRoute = () => {
    const { isDirAdminAuthenticated, loading } = useDirectoryAuth();

    // 1. Wait for the context to finish its initial check
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-apple-gray-800">
                <Spinner size="lg" />
            </div>
        );
    }

    // 2. After checking, decide to render the content or redirect
    return isDirAdminAuthenticated ? <Outlet /> : <Navigate to="/directory-admin/login" replace />;
};

export default DirectoryAdminRoute;