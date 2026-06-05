// src/layouts/MainLayout.js

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AppTour from '../Onboarding/AppTour';
import WalletTourTrigger from '../Onboarding/WalletTourTrigger';
import { AppTourProvider } from '../../contexts/AppTourContext';
import { WalletGuardProvider } from '../../contexts/WalletGuardContext';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <AppTourProvider>
            <WalletGuardProvider>
                <div className="relative flex h-screen bg-apple-gray-100 dark:bg-apple-gray-950 text-apple-gray-800 dark:text-apple-gray-200">
                    <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white dark:bg-black p-4 sm:p-6">
                            <div className="max-w-7xl mx-auto ">
                                <Outlet />
                            </div>
                        </main>
                        <AppTour />
                        <WalletTourTrigger />
                    </div>
                </div>
            </WalletGuardProvider>
        </AppTourProvider>
    );
};

export default MainLayout;