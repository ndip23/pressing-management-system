// client/src/components/Dashboard/SubscriptionLockOverlay.jsx

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock } from 'lucide-react';
import Button from '../UI/Button';

const SubscriptionLockOverlay = ({ onUpgradeClick }) => {
    const { user } = useAuth();

    // The subscription status is nested inside the 'tenant' object in our user state.
    const status = user?.tenant?.subscriptionStatus;

    // --- ✅ FIX: ALLOW 'trial' STATUS ---
    // We check if the status is defined, and if it is NOT in our allowed list.
    // Allowed list: 'active', 'trial' (new standard), 'trialing' (legacy support)
    const isLocked = status && !['active', 'trial', 'trialing'].includes(status);

    // If not locked (or status is missing/loading), don't show anything
    if (!isLocked) {
        return null;
    }

    // --- Dynamic Messages based on why it's locked ---
    let title = "Your Account is Inactive";
    let message = "Please upgrade your subscription to regain access to all features.";
    
    if (status === 'past_due') {
        title = "Payment Required";
        message = "Your subscription is past due. Please update your plan to restore access.";
    } else if (status === 'canceled' || status === 'cancelled') {
        title = "Subscription Canceled";
        message = "Your subscription has been canceled. Please choose a new plan to reactivate your account.";
    } else if (status === 'expired') {
        title = "Trial Expired";
        message = "Your free trial has ended. Please pick a plan to continue using lsmbooker.";
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-apple-gray-800 p-8 rounded-xl shadow-2xl text-center max-w-md w-full animate-fade-in-up">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                    <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <p className="mt-2 text-gray-600 dark:text-apple-gray-400">{message}</p>
                <div className="mt-6">
                    <Button variant="primary" size="lg" onClick={onUpgradeClick}>
                        View Pricing Plans
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionLockOverlay;