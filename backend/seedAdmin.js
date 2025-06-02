// server/seedAdmin.js
import dotenv from 'dotenv';
dotenv.config(); // LOAD ENV VARIABLES FIRST THING

import mongoose from 'mongoose';
import User from './models/User.js'; // Assuming User model handles password hashing pre-save

const connectDBForSeed = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not found in .env file. Make sure .env is configured.');
            process.exit(1);
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected for Seeding: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB for Seeding: ${error.message}`);
        process.exit(1);
    }
};

// --- Define your admin users here ---
const adminUsersToSeed = [
    {
        username: 'admin1',
        password: 'AdminPassword1!', // CHANGE THESE PASSWORDS!
    },
    {
        username: 'admin2',
        password: 'AnotherSecurePassword2@', // CHANGE THESE PASSWORDS!
    },
    // Add more admin objects as needed
    // {
    //     username: 'superadmin',
    //     password: 'SuperStrongPassword3#',
    // },
];
// --- ---

const seedAdmins = async () => {
    try {
        await connectDBForSeed();

        for (const adminData of adminUsersToSeed) {
            const adminUsername = adminData.username.toLowerCase();
            const adminPassword = adminData.password;

            if (!adminUsername || !adminPassword) {
                console.warn(`Skipping admin entry due to missing username or password: ${JSON.stringify(adminData)}`);
                continue;
            }

            const adminExists = await User.findOne({ username: adminUsername });
            if (adminExists) {
                console.log(`Admin user '${adminUsername}' already exists. Skipping.`);
            } else {
                await User.create({
                    username: adminUsername,
                    password: adminPassword, // Password will be hashed by the pre-save hook in User model
                    role: 'admin',
                });
                console.log(`Admin user '${adminUsername}' created successfully.`);
            }
        }

        console.log('Admin seeding process completed.');

    } catch (error) {
        console.error('Error during admin seeding process:', error);
        process.exitCode = 1; // Indicate an error exit
    } finally {
        // Ensure connection is closed whether success or failure (if connected)
        if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
            await mongoose.connection.close();
            console.log('MongoDB connection closed.');
        }
        // process.exit() will be handled by Node.js based on process.exitCode
    }
};

seedAdmins();