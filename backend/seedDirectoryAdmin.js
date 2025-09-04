// server/seedDirectoryAdmin.js
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from './config/db.js';
import DirectoryAdmin from './models/DirectoryAdmin.js'; // Import the model

// --- CONFIGURE YOUR ADMIN CREDENTIALS HERE ---
const adminCredentials = [
    {
        username: 'directoryadmin',
        password: 'A_Very_Strong_Password_123!', // This will now be hashed
    },
];
// --- ---

const importData = async () => {
    try {
        await connectDB();

        // Clear existing directory admins
        await DirectoryAdmin.deleteMany();
        console.log('Previous Directory Admins cleared.');

        // Use Model.create() to trigger the 'pre-save' hook for hashing
        // This will create each user one by one, which is fine for a small seeder.
        await DirectoryAdmin.create(adminCredentials);

        console.log(`✅ Directory Admin user(s) successfully imported and passwords hashed!`);
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