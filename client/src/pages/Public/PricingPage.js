// client/src/pages/Public/PricingPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/UI/Button';
import { Check } from 'lucide-react';

// --- Reusable Public Header and Footer (Ideally from shared components) ---
const PublicHeader = () => (
    <header className="sticky top-0 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-md z-50 shadow-apple-sm">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-apple-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span className="text-xl font-bold text-apple-gray-800 dark:text-apple-gray-100">PressFlow</span>
            </Link>
            <div className="hidden md:flex space-x-6 items-center">
                <Link to="/" className="text-sm font-medium hover:text-apple-blue transition-colors">Home</Link>
                <Link to="/features" className="text-sm font-medium hover:text-apple-blue transition-colors">Features</Link>
                <Link to="/pricing" className="text-sm font-bold text-apple-blue transition-colors">Pricing</Link>
            </div>
            <div className="space-x-4 flex items-center">
                <Link to="/login" className="text-sm font-medium hover:text-apple-blue transition-colors">Login</Link>
                <Link to="/signup">
                    <Button variant="primary" size="md">Get Started</Button>
                </Link>
            </div>
        </nav>
    </header>
);

const PublicFooter = () => (
    <footer className="bg-apple-gray-100 dark:bg-black/20">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-apple-gray-500 dark:text-apple-gray-400">
            <p>© {new Date().getFullYear()} PressFlow. All Rights Reserved.</p>
            <div className="mt-4 space-x-6">
                <Link to="/privacy" className="hover:text-apple-blue">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-apple-blue">Terms of Service</Link>
                <Link to="/contact" className="hover:text-apple-blue">Contact</Link>
            </div>
        </div>
    </footer>
);

// --- Reusable Pricing Card Component ---
const PricingCard = ({ plan, price, frequency, features, isFeatured = false }) => (
    <div className={`relative p-8 rounded-apple-xl border ${isFeatured ? 'border-apple-blue shadow-apple-xl' : 'border-apple-gray-200 dark:border-apple-gray-700 bg-white dark:bg-apple-gray-800/50'}`}>
        {isFeatured && (
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold text-white bg-apple-blue">
                    Most Popular
                </span>
            </div>
        )}
        <h3 className="text-2xl font-semibold text-apple-gray-800 dark:text-white mb-2">{plan}</h3>
        <div className="flex items-baseline mb-6">
            <span className="text-5xl font-bold tracking-tight text-apple-gray-900 dark:text-white">{price}</span>
            <span className="ml-1 text-xl font-medium text-apple-gray-500 dark:text-apple-gray-400">/{frequency}</span>
        </div>
        <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                    <Check size={16} className="text-apple-green flex-shrink-0 mr-3 mt-1" />
                    <span className="text-apple-gray-600 dark:text-apple-gray-300">{feature}</span>
                </li>
            ))}
        </ul>
        <Link to="/signup" className="w-full">
             <Button variant={isFeatured ? 'primary' : 'secondary'} size="lg" className="w-full">
                Choose {plan}
            </Button>
        </Link>
    </div>
);


const PricingPage = () => {
    // You can manage this with state if you have monthly/yearly toggles
    const [billingCycle, setBillingCycle] = useState('monthly');

    const plans = {
        monthly: [
            {
                plan: 'Basic',
                price: '$29',
                frequency: 'mo',
                features: [
                    'Up to 250 Orders per month',
                    '2 Staff Accounts',
                    'Customer Management',
                    'Payment Tracking',
                    'Email Notifications',
                ],
                isFeatured: false,
            },
            {
                plan: 'Pro',
                price: '$59',
                frequency: 'mo',
                features: [
                    'Unlimited Orders',
                    'Up to 10 Staff Accounts',
                    'Everything in Basic',
                    'SMS Notifications (Twilio)',
                    'Basic Sales Reports',
                    'Admin Bell Notifications',
                ],
                isFeatured: true,
            },
            {
                plan: 'Enterprise',
                price: 'Custom',
                frequency: 'contact',
                features: [
                    'Everything in Pro',
                    'Unlimited Staff Accounts',
                    'Custom Branding',
                    'Advanced Analytics',
                    'Priority Support',
                    'Onboarding Assistance',
                ],
                isFeatured: false,
            },
        ],
        // You could define yearly plans here and toggle between them
        // yearly: [ ... ]
    };

    return (
        <div className="bg-apple-gray-50 dark:bg-apple-gray-950">
            <PublicHeader />

            <main>
                {/* --- Page Header Section --- */}
                <section className="py-20 text-center">
                    <div className="container mx-auto px-6">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-apple-gray-900 dark:text-white mb-4">
                            Find the Right Plan for Your Business
                        </h1>
                        <p className="text-lg text-apple-gray-600 dark:text-apple-gray-400 max-w-2xl mx-auto">
                            Simple, transparent pricing. Choose the plan that fits your needs and start streamlining your operations today.
                        </p>
                    </div>
                </section>

                {/* --- Pricing Cards Section --- */}
                <section className="pb-20">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                           {plans[billingCycle].map((p, index) => (
                               <PricingCard
                                   key={index}
                                   plan={p.plan}
                                   price={p.price}
                                   frequency={p.frequency}
                                   features={p.features}
                                   isFeatured={p.isFeatured}
                               />
                           ))}
                        </div>
                    </div>
                </section>

                {/* --- FAQ Section (Optional but good) --- */}
                <section className="py-20 bg-white dark:bg-apple-gray-900">
                    <div className="container mx-auto px-6 max-w-3xl">
                        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold mb-1">Is there a free trial?</h4>
                                <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">Yes! You can sign up for our Pro plan and use it for free for 14 days, no credit card required upfront.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">Can I change my plan later?</h4>
                                <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">Absolutely. You can easily upgrade or downgrade your plan from your account settings at any time.</p>
                            </div>
                             <div>
                                <h4 className="font-semibold mb-1">What are the requirements for SMS notifications?</h4>
                                <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">The SMS feature integrates with Twilio. You will need your own Twilio account and credentials. Standard Twilio messaging rates will apply.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    );
};

export default PricingPage;