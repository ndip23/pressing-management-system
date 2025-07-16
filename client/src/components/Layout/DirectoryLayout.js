// client/src/components/Layout/DirectoryLayout.js
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import DirectoryHeader from './DirectoryHeader'; 
// You can create a DirectoryFooter component later if you want a different footer
// import DirectoryFooter from './DirectoryFooter';
const PublicFooter = () => (
    <footer className="bg-apple-gray-100 dark:bg-black/20">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-apple-gray-500 dark:text-apple-gray-400">
            <p>© {new Date().getFullYear()} PressFlow. All Rights Reserved.</p>
            <div className="mt-4 space-x-6">
                <Link to="/privacy" className="hover:text-apple-blue">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-apple-blue">Terms of Service</Link>
                <Link to="/contact" className="hover:text-apple-blue">Contact</Link>
            </div>
        </div>
    </footer>
);
const DirectoryLayout = () => (
    <div className="bg-apple-gray-100 dark:bg-apple-gray-950 min-h-screen">
        <DirectoryHeader />
        <main>
            {/* The nested directory pages (DirectoryPage, BusinessProfilePage) will render here */}
            <Outlet />
        </main>
        <PublicFooter/>
    </div>
);

export default DirectoryLayout; // <<<<< THIS LINE WAS MISSING