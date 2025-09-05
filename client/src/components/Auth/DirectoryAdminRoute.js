// client/src/components/Auth/DirectoryAdminRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useDirectoryAuth } from '../../contexts/DirectoryAuthContext';
import Spinner from '../UI/Spinner';

const DirectoryAdminRoute = () => {
    const { isDirAdminAuthenticated, loading } = useDirectoryAuth();

    // While the context is doing its initial check, show a full-page loading spinner.
    // This PREVENTS the redirect logic from running prematurely.
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-apple-gray-800">
                <Spinner size="lg" />
            </div>
        );
    }

    // Only after loading is false, make the decision to render content or redirect.
    return isDirAdminAuthenticated ? <Outlet /> : <Navigate to="/directory-admin/login" replace />;
};

export default DirectoryAdminRoute;