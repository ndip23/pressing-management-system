import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Plan from './models/Plan.js';

dotenv.config();
connectDB();
const defaultPlans = [
    {
        name: 'Basic',
   prices: [{ currency: 'USD', amount: 29 }],
        features: [
            'Register and manage your clients manually',
            'Generate receipts for every transaction',
            '1 user account',
            'Works on Android & Laptop',
            'Includes a 1-month free trial'
        ],
        limits: {
            maxStaff: 2, // Only the owner
            maxOrdersPerMonth: 50,
        },
        isActive: true,
        isFeatured: false,
    },
    {
        name: 'Starter',
      prices: [{ currency: 'USD', amount: 29 }],
        features: [
            'Get local traffic',
            'Home pickups & deliveries with tracking',
            'In-app messaging with clients',
            'Bulk SMS & email promotions',
            'Up to 2 worker accounts',
            'Real-time activity tracking',
            'Daily, weekly, monthly sales reports',
            'Automated customer retention tools'
        ],
        limits: {
            maxStaff: 5,
            maxOrdersPerMonth: 250,
        },
        isActive: true,
        isFeatured: false,
    },
    {
        name: 'Growth',
     prices: [{ currency: 'USD', amount: 29 }],
        features: [
            'Everything in Starter Plan',
            '3x more customer traffic',
            'Priority directory listing',
            'Up to 5 worker accounts',
            'Advanced analytics dashboard',
            'Automated client reminders'
        ],
        limits: {
            maxStaff: 7,
            maxOrdersPerMonth: 500,
        },
        isActive: true,
        isFeatured: true, // This is the most popular plan
    },
    {
        name: 'Pro',
    prices: [{ currency: 'USD', amount: 29 }],
        features: [
            'Everything in Growth Plan',
            '6x more customer traffic & premium placement',
            'Up to 15 worker accounts',
            'Detailed activity tracking to prevent fraud',
            'One-click access to all sales reports',
            'Dedicated priority support'
        ],
        limits: {
            maxStaff: 15,
            maxOrdersPerMonth: -1, // No limit
        },
        isActive: true,
        isFeatured: false,
    },
];
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
