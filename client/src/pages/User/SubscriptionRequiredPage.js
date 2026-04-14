import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Zap, CreditCard } from 'lucide-react';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

const SubscriptionRequiredPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-apple-gray-50 dark:bg-apple-gray-950 p-6">
            <Card className="max-w-lg w-full text-center p-10 shadow-apple-xl">
                <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
                    <AlertTriangle size={40} className="text-apple-red" />
                </div>
                <h1 className="text-3xl font-bold text-apple-gray-900 dark:text-white mb-4">
                    Subscription Required
                </h1>
                <p className="text-apple-gray-600 dark:text-apple-gray-400 mb-8">
                    Your trial has expired or your subscription is currently inactive. 
                    To continue managing your pressing business and accessing your dashboard, please select a plan and complete your payment.
                </p>
                <div className="space-y-4">
                    <Button 
                        variant="primary" 
                        size="lg" 
                        className="w-full flex justify-center items-center gap-2"
                        onClick={() => navigate('/app/subscription')}
                    >
                        <Zap size={18} />
                        View Subscription Plans
                    </Button>
                    <p className="text-sm text-apple-gray-400">
                        <CreditCard size={14} className="inline mr-1" />
                        Secure payment processing by AccountPe
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default SubscriptionRequiredPage;