import React from 'react';
import { Outlet } from 'react-router-dom';
import DirectoryHeader from './DirectoryHeader'; // Import the new header
// You can have a different, simpler footer as well

const DirectoryLayout = () => (
    <div className="bg-apple-gray-100 dark:bg-apple-gray-950 min-h-screen">
        <DirectoryHeader />
        <main>
            <Outlet /> {/* Directory pages will render here */}
        </main>
        {/* <DirectoryFooter /> */}
    </div>
);