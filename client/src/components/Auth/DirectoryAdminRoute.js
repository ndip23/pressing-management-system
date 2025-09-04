// client/src/components/Auth/DirectoryAdminRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useDirectoryAuth } from '../../contexts/DirectoryAuthContext';
import Spinner from '../UI/Spinner';

const DirectoryAdminRoute = () => {
    const { isDirAdminAuthenticated, loading } = useDirectoryAuth();

    // 1. While the context is doing its initial check, show a loading spinner
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-apple-gray-800">
                <Spinner size="lg" />
            </div>
        );
    }

    // 2. After the check is complete, THEN decide where to go
    return isDirAdminAuthenticated ? <Outlet /> : <Navigate to="/directory-admin/login" replace />;
};

export default DirectoryAdminRoute;