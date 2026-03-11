// client/src/components/Pricing/ChoosePlanButton.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { changeSubscriptionPlanApi } from '../../services/api';
import Button from '../UI/Button';
import toast from 'react-hot-toast';

const ChoosePlanButton = ({ planName, isFeatured }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        if (!window.confirm(`You will be redirected to our payment partner to complete the subscription for the ${planName} plan. Continue?`)) {
            return;
        }
        setIsLoading(true);
        try {
            const { data } = await changeSubscriptionPlanApi({ planName });
            // The 'data' now contains the payment link from AccountPe
            if (data.data && data.data.payment_link) {
                // Redirect the user to the payment page
                window.location.href = data.data.payment_link;
            } else {
                toast.error("Could not generate payment link.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to initiate upgrade.");
        } finally {
            setIsLoading(false);
        }
    };

    if (user) { // User is logged in
        if (user.plan === planName) {
            return <Button variant="secondary" size="lg" className="w-full" disabled>Current Plan</Button>;
        }
        return <Button variant={isFeatured ? 'primary' : 'secondary'} size="lg" className="w-full" onClick={handleUpgrade} isLoading={isLoading}>Upgrade to {planName}</Button>;
    } else { // User is a guest
        // The link correctly passes the plan to the registration page
        return (
            <Link to={`/signup?plan=${planName.toLowerCase()}`} className="w-full">
                <Button variant={isFeatured ? 'primary' : 'secondary'} size="lg" className="w-full">
                    Choose {planName}
                </Button>
            </Link>
        );
    }
};

export default ChoosePlanButton;