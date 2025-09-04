// server/seedDirectoryAdmin.js
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from './config/db.js';
import DirectoryAdmin from './models/DirectoryAdmin.js'; // Import the new model

// --- CONFIGURE YOUR ADMIN CREDENTIALS HERE ---
const adminCredentials = [
    {
        username: 'directoryadmin', // Choose your desired username
        password: 'A_Very_Strong_Password_123!', // Choose a strong password
    },
    // You could add more directory admins here if needed
];
// --- ---

const importData = async () => {
    try {
        await connectDB();

        // Clear existing directory admins
        await DirectoryAdmin.deleteMany();

        // Create new directory admins from the array
        await DirectoryAdmin.insertMany(adminCredentials);

        console.log('✅ Directory Admin user(s) successfully imported!');
        process.exit();
    } catch (error) {
        console.error('❌ ERROR seeding directory admin:', error);
        process.exit(1);
    }
};

// This allows you to run a destroy command too, e.g., `node seedDirectoryAdmin.js -d`
const destroyData = async () => {
    try {
        await connectDB();
        await DirectoryAdmin.deleteMany();
        console.log('✅ Directory Admin user(s) successfully destroyed!');
        process.exit();
    } catch (error) {
        console.error('❌ ERROR destroying directory admin:', error);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}