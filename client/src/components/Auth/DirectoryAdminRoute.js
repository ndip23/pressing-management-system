// client/src/components/Auth/DirectoryAdminRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const DirectoryAdminRoute = () => {
    const token = localStorage.getItem('directoryAdminToken');
    return token ? <Outlet /> : <Navigate to="/directory-admin/login" replace />;
};

export default DirectoryAdminRoute;