// client/src/components/Dashboard/SubscriptionBanner.jsx

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, CreditCard } from 'lucide-react';

const SubscriptionBanner = ({ onUpgradeClick }) => {
    const { user } = useAuth();

    // --- THIS IS THE FIX ---
    const status = user?.tenant?.subscriptionStatus;
    const trialEndDateString = user?.tenant?.trialEndsAt;

    if (!user || status === 'active') {
        return null;
    }

    let message = '';
    
    if (status === 'trialing' && trialEndDateString) {
        const endDate = new Date(trialEndDateString);
        const now = new Date();
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        if (daysLeft > 7) {
            return null; 
        } else if (daysLeft > 0) {
            message = `Your free trial expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`;
        } else {
            message = "Your free trial has expired. Please upgrade to continue.";
        }
    } else if (status === 'past_due') {
        message = "Your subscription payment is past due. Please update your plan to continue.";
    }

    if (!message) return null;

    return (
        <div className="bg-yellow-100 text-yellow-900 p-3 text-center text-sm font-medium">
            <div className="container mx-auto flex justify-center items-center gap-3 flex-wrap">
                <AlertTriangle size={18} className="flex-shrink-0" />
                <span>{message}</span>
                <button onClick={onUpgradeClick} className="ml-2 font-bold underline hover:text-yellow-900 flex items-center gap-2 bg-yellow-200 px-3 py-1 rounded-full transition-colors">
                    <CreditCard size={16} />
                    <span>Upgrade Now</span>
                </button>
            </div>
        </div>
    );
};

export default SubscriptionBanner;