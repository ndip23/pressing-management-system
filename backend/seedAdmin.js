// server/seedAdmin.js
import dotenv from 'dotenv'; // Import dotenv
dotenv.config(); // <<<<<<< LOAD ENV VARIABLES FIRST THING

import mongoose from 'mongoose';
// import connectDB from './config/db.js'; // We'll call mongoose.connect directly for simplicity here or ensure connectDB also has dotenv
import User from './models/User.js';

const connectDBForSeed = async () => { // Local connect function for the seeder
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


const seedAdmin = async () => {
    try {
        await connectDBForSeed(); // Connect to DB first

        // Optional: clean existing admins if desired for a fresh seed
        // await User.deleteMany({ role: 'admin' });
        // console.log('Previous admin users deleted (if any).');

        const adminUsername = 'admin'; // Or get from .env if you prefer
        const adminPassword = 'yoursecureadminpassword'; // CHANGE THIS!

        const adminExists = await User.findOne({ username: adminUsername.toLowerCase() });
        if (adminExists) {
            console.log(`Admin user '${adminUsername}' already exists.`);
            mongoose.connection.close();
            process.exit();
        }

        await User.create({
            username: adminUsername.toLowerCase(),
            password: adminPassword, 
            role: 'admin',
        });
        console.log(`Admin user '${adminUsername}' created successfully.`);
        mongoose.connection.close(); // Close the connection after seeding
        process.exit();
    } catch (error) {
        console.error('Error seeding admin user:', error);
        if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
            mongoose.connection.close();
        }
        process.exit(1);
    }
};

seedAdmin();