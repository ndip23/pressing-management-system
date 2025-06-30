// client/src/pages/Public/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, BarChart2, Bell, Smartphone, DollarSign, Zap } from 'lucide-react';

const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-white dark:bg-apple-gray-900 p-6 rounded-apple-lg shadow-apple-md border border-apple-gray-100 dark:border-apple-gray-800">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-apple-blue/10 mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-apple-gray-800 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">{description}</p>
    </div>
);

const LandingPage = () => {
    return (
        <>
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 bg-apple-gray-50 dark:bg-apple-gray-900 text-center">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-6xl font-bold text-apple-gray-900 dark:text-white mb-4 leading-tight">
                            Streamline Your Laundry Business with <span className="text-apple-blue">PressFlow</span>
                        </h1>
                        <p className="text-lg text-apple-gray-600 dark:text-apple-gray-300 mb-8">
                            The all-in-one management system for order tracking, customer notifications, and payment handling. Spend less time managing, more time growing.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <Link to="/signup" className="bg-apple-blue text-white px-8 py-3 rounded-apple font-semibold hover:bg-sky-600 transition-transform transform hover:scale-105 shadow-apple-lg">
                                Get Started for Free
                            </Link>
                            <Link to="/#features" className="bg-white dark:bg-apple-gray-800 text-apple-blue dark:text-white px-8 py-3 rounded-apple font-semibold hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-transform transform hover:scale-105 shadow-apple-lg">
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white dark:bg-apple-gray-950">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-apple-gray-800 dark:text-white">Everything You Need to Run Your Shop</h2>
                        <p className="text-md text-apple-gray-500 dark:text-apple-gray-400 mt-2">From drop-off to pickup, PressFlow has you covered.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap size={24} className="text-apple-blue" />}
                            title="Effortless Order Management"
                            description="Log orders in seconds. Track items, services, quantities, and special instructions with ease. Never lose an order again."
                        />
                        <FeatureCard
                            icon={<Bell size={24} className="text-apple-blue" />}
                            title="Automated Notifications"
                            description="Automatically notify customers via Email or SMS/WhatsApp when their orders are ready for pickup, reducing calls and improving satisfaction."
                        />
                        <FeatureCard
                            icon={<DollarSign size={24} className="text-apple-blue" />}
                            title="Simple Payment Tracking"
                            description="Keep track of payments with a clear view of what's paid, what's due, and apply discounts on the fly."
                        />
                        <FeatureCard
                            icon={<Users size={24} className="text-apple-blue" />}
                            title="Customer Database"
                            description="Build a relationship with your customers. View their history and contact information all in one place."
                        />
                        <FeatureCard
                            icon={<BarChart2 size={24} className="text-apple-blue" />}
                            title="Admin Dashboard"
                            description="Get a high-level overview of your operations. See key metrics, overdue orders, and manage everything from a central hub."
                        />
                        <FeatureCard
                            icon={<Smartphone size={24} className="text-apple-blue" />}
                            title="Desktop & Web Access"
                            description="Manage your business from anywhere with our web application, and provide a stable desktop experience for your in-store staff."
                        />
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="bg-apple-gray-100 dark:bg-apple-gray-900 py-20">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-apple-gray-800 dark:text-white">Ready to Modernize Your Business?</h2>
                    <p className="text-lg text-apple-gray-600 dark:text-apple-gray-300 mt-2 mb-8">
                        Join dozens of other laundry services simplifying their workflow with PressFlow.
                    </p>
                    <Link to="/signup" className="bg-apple-blue text-white px-10 py-4 rounded-apple font-semibold text-lg hover:bg-sky-600 transition-transform transform hover:scale-105 shadow-apple-xl">
                        Start Your Free Trial
                    </Link>
                </div>
            </section>
        </>
    );
};

export default LandingPage;