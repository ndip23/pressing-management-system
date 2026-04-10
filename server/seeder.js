// server/seeder.js

import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Import necessary models
import DirectoryAdmin from './models/DirectoryAdmin.js';
import Plan from './models/Plan.js';

// Import others just to ensure connection works, but we won't touch them
import Tenant from './models/Tenant.js'; 

dotenv.config();
connectDB();

// --- PLANS WITH NEW LIMITS ---
const defaultPlans = [
    {
        name: 'Basic',
        prices: [
            { currency: 'USD', amount: 29 },
            { currency: 'EUR', amount: 27 },
            { currency: 'GBP', amount: 23 },
            { currency: 'CAD', amount: 39 },
            { currency: 'XAF', amount: 100 },
            { currency: 'XOF', amount: 18000 },
            { currency: 'NGN', amount: 25000 },
            { currency: 'GHS', amount: 350 },
            { currency: 'KES', amount: 3800 },
            { currency: 'ZAR', amount: 550 },
            { currency: 'ZWL', amount: 0 },
            { currency: 'PHP', amount: 110 },
        ],
        features: [
            'Register and manage your clients manually',
            'Generate receipts for every transaction',
            '1 user account',
            'Works on Android & Laptop',
            'Includes a 1-month free trial'
        ],
        limits: {
            maxStaff: 2, 
            maxOrdersPerMonth: 50, // ✅ Limit: 50
        },
        isActive: true,
        isFeatured: false,
    },
    {
        name: 'Starter',
        prices: [
            { currency: 'USD', amount: 29 },
            { currency: 'EUR', amount: 27 },
            { currency: 'GBP', amount: 23 },
            { currency: 'CAD', amount: 39 },
            { currency: 'XAF', amount: 18000 },
            { currency: 'XOF', amount: 18000 },
            { currency: 'NGN', amount: 25000 },
            { currency: 'GHS', amount: 350 },
            { currency: 'KES', amount: 3800 },
            { currency: 'ZAR', amount: 550 },
            { currency: 'ZWL', amount: 0 },
            { currency: 'PHP', amount: 560 },
        ],
        features: [
            'Get local traffic',
            'Home pickups & deliveries',
            'In-app messaging',
            'Bulk SMS & email',
            'Up to 2 worker accounts',
            'Real-time tracking',
            'Reports'
        ],
        limits: {
            maxStaff: 5,
            maxOrdersPerMonth: 250, // ✅ Limit: 250
        },
        isActive: true,
        isFeatured: false,
    },
    {
        name: 'Growth',
        prices: [
            { currency: 'USD', amount: 29 },
            { currency: 'EUR', amount: 27 },
            { currency: 'GBP', amount: 23 },
            { currency: 'CAD', amount: 39 },
            { currency: 'XAF', amount: 18000 },
            { currency: 'XOF', amount: 18000 },
            { currency: 'NGN', amount: 25000 },
            { currency: 'GHS', amount: 350 },
            { currency: 'KES', amount: 3800 },
            { currency: 'ZAR', amount: 550 },
            { currency: 'ZWL', amount: 0 },
            { currency: 'PHP', amount: 1400 },
        ],
        features: [
            'Everything in Starter',
            '3x traffic',
            'Priority listing',
            'Up to 5 worker accounts',
            'Advanced analytics'
        ],
        limits: {
            maxStaff: 7,
            maxOrdersPerMonth: -1, // ✅ Unlimited
        },
        isActive: true,
        isFeatured: true,
    },
    {
        name: 'Pro',
        prices: [
            { currency: 'USD', amount: 29 },
            { currency: 'EUR', amount: 27 },
            { currency: 'GBP', amount: 23 },
            { currency: 'CAD', amount: 39 },
            { currency: 'XAF', amount: 18000 },
            { currency: 'XOF', amount: 18000 },
            { currency: 'NGN', amount: 25000 },
            { currency: 'GHS', amount: 350 },
            { currency: 'KES', amount: 3800 },
            { currency: 'ZAR', amount: 550 },
            { currency: 'ZWL', amount: 0 },
            { currency: 'PHP', amount: 2800 },
        ],
        features: [
            'Everything in Growth',
            '6x traffic',
            'Up to 15 worker accounts',
            'Fraud prevention',
            'Priority support'
        ],
        limits: {
            maxStaff: 15,
            maxOrdersPerMonth: -1, // ✅ Unlimited
        },
        isActive: true,
        isFeatured: false,
    },
];

const updateData = async () => {
    try {
        console.log('🚀 Starting Update...');

        // 1. Refresh Directory Admin (Safe)
        await DirectoryAdmin.deleteMany();
       if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
            await DirectoryAdmin.create({
                username: 'admin', // ✅ Changed from 'Super Admin' to 'admin'
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
            });
            console.log(`✅ Directory Admin refreshed (User: admin, Email: ${process.env.ADMIN_EMAIL}).`);
        }

        // 2. Refresh Plans (Safe - Tenants link by string name)
        await Plan.deleteMany();
        await Plan.insertMany(defaultPlans);
        console.log(`✅ Plans updated with new Order Limits.`);

        console.log('-----------------------------------');
        console.log('✅ SUCCESS: System updated.');
        console.log('🛡️  NOTE: No Customers, Orders, or Tenants were deleted.');
        console.log('-----------------------------------');
        process.exit();

    } catch (error) {
        console.error(`❌ Error during update: ${error}`);
        process.exit(1);
    }
};
updateData()