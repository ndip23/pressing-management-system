// client/src/pages/User/AppSubscriptionPage.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getPublicPlansApi, changeSubscriptionPlanApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import { Check, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { COUNTRY_TO_CURRENCY } from '../../utils/currencyMap';

const AppSubscriptionPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [upgradingPlan, setUpgradingPlan] = useState(null);

    const userCountryCode = user?.tenant?.countryCode || 'CM';
    const userCurrency = COUNTRY_TO_CURRENCY[userCountryCode] || 'USD';

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const { data } = await getPublicPlansApi();
                const sortedData = data.sort((a, b) => {
                    const priceA = a.prices.find(p => p.currency === 'USD')?.amount || 0;
                    const priceB = b.prices.find(p => p.currency === 'USD')?.amount || 0;
                    return priceA - priceB;
                });
                // ✅ FIX: Removed the .filter() so the Basic plan shows up
                setPlans(sortedData); 
            } catch (error) {
                toast.error("Failed to load subscription plans.");
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleUpgrade = async (planName) => {
        setUpgradingPlan(planName);
        try {
            const response = await changeSubscriptionPlanApi({ planName });
            if (response.data?.data?.payment_link) {
                window.location.href = response.data.data.payment_link;
            } else {
                toast.error("Failed to generate payment link.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Upgrade failed.");
        } finally {
            setUpgradingPlan(null);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

    const isTrial = user?.tenant?.subscriptionStatus === 'trial';
    const isTrialExpired = isTrial && new Date() > new Date(user.tenant.trialEndsAt);

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-apple-gray-800 dark:text-white">Subscription & Billing</h1>
            </div>

            <Card className={`p-6 border-l-4 ${isTrialExpired ? 'border-apple-red' : 'border-apple-blue'}`}>
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            Current Plan: <span className="text-black dark:text-white font-bold">{user?.tenant?.plan || 'Unknown'}</span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Status: <span className={`font-semibold uppercase ${!isTrialExpired ? 'text-green-500' : 'text-apple-red'}`}>
                                {isTrialExpired ? 'Expired' : user?.tenant?.subscriptionStatus}
                            </span>
                        </p>
                        {isTrial && (
                            <p className={`text-sm mt-2 ${isTrialExpired ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                {isTrialExpired 
                                    ? "🚨 Your trial has expired! Please subscribe to a plan to unlock your dashboard." 
                                    : `⏳ Trial ends on: ${new Date(user.tenant.trialEndsAt).toLocaleDateString()}`}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            <h2 className="text-xl font-bold mt-8 mb-4">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const localPriceObj = plan.prices.find(p => p.currency === userCurrency);
                    const fallbackPriceObj = plan.prices.find(p => p.currency === 'USD');
                    
                    const displayPrice = localPriceObj ? localPriceObj.amount : fallbackPriceObj?.amount;
                    const displayCurrency = localPriceObj ? localPriceObj.currency : 'USD';
                    
                    const isCurrentPlan = user?.tenant?.plan === plan.name;

                    // ✅ FIX: If they are on a trial, they must be able to click the button to pay for the Basic plan!
                    // Only disable the button if they are already on an ACTIVE PAID version of that plan.
                    const disableButton = isCurrentPlan && !isTrial; 
                    const buttonText = (isCurrentPlan && isTrial) ? `Subscribe to ${plan.name}` : (isCurrentPlan ? "Current Plan" : `Upgrade to ${plan.name}`);

                    return (
                        <Card key={plan._id} className={`flex flex-col p-6 transition-all ${plan.isFeatured ? 'ring-2 ring-apple-blue shadow-lg scale-105' : ''}`}>
                            <h3 className="text-xl font-bold">{plan.name}</h3>
                            <p className="text-3xl font-black mt-4 mb-6">
                                {displayCurrency} {displayPrice} <span className="text-sm text-gray-500 font-normal">/mo</span>
                            </p>
                            
                            <ul className="space-y-3 mb-8 flex-grow">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                                        <Check size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Button 
                                onClick={() => handleUpgrade(plan.name)} 
                                isLoading={upgradingPlan === plan.name}
                                disabled={disableButton || upgradingPlan !== null}
                                variant={disableButton ? "secondary" : "primary"}
                                iconLeft={!disableButton && <Zap size={16} />}
                                className="w-full"
                            >
                                {buttonText}
                            </Button>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default AppSubscriptionPage;