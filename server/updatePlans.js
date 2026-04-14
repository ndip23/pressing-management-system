import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Plan from './models/Plan.js';

dotenv.config();
connectDB();
const defaultPlans = [
    {
        name: 'Basic',
        prices: [
            { currency: 'USD', amount: 29 },
            { currency: 'XAF', amount: 18000 },
            { currency: 'XOF', amount: 18000 },
            { currency: 'KES', amount: 3800 },

            // Added from your currency map
            { currency: 'GNF', amount: 250000 },
            { currency: 'INR', amount: 2400 },
            { currency: 'TZS', amount: 70000 },
            { currency: 'UGX', amount: 110000 }
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
            { currency: 'XAF', amount: 18000 },
            { currency: 'XOF', amount: 18000 },
            { currency: 'KES', amount: 3800 },

            // Added from your currency map
            { currency: 'GNF', amount: 250000 },
            { currency: 'INR', amount: 2400 },
            { currency: 'TZS', amount: 70000 },
            { currency: 'UGX', amount: 110000 }
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
            { currency: 'XAF', amount: 18000 },
            { currency: 'XOF', amount: 18000 },
            { currency: 'KES', amount: 3800 },

            // Added from your currency map
            { currency: 'GNF', amount: 250000 },
            { currency: 'INR', amount: 2400 },
            { currency: 'TZS', amount: 70000 },
            { currency: 'UGX', amount: 110000 }
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
            { currency: 'XAF', amount: 18000 },
            { currency: 'XOF', amount: 18000 },
            { currency: 'KES', amount: 3800 },

            // Added from your currency map
            { currency: 'GNF', amount: 250000 },
            { currency: 'INR', amount: 2400 },
            { currency: 'TZS', amount: 70000 },
            { currency: 'UGX', amount: 110000 }
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
;
const runUpdate = async () => {
    try {
        console.log('⏳ Updating Plans in Database...');
        
        // 1. Delete ONLY Plans (This does NOT touch Customers/Orders)
        await Plan.deleteMany();
        console.log('✅ Old plans removed.');

        // 2. Insert NEW Plans with Limits
        await Plan.insertMany(defaultPlans);
        console.log('✅ New plans with limits inserted.');

        console.log('🎉 SUCCESS: Database updated.');
        process.exit();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

runUpdate();
