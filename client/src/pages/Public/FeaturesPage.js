// client/src/pages/Public/FeaturesPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/UI/Button'; // Assuming your Button component is here
import {  CreditCard, Bell, Users, SlidersHorizontal, PackagePlus, Clock, Printer } from 'lucide-react';

// --- Reusable Header/Navbar for Public Pages ---
// For consistency, you might want to move this into its own component later
const PublicHeader = () => (
    <header className="sticky top-0 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-md z-50 shadow-apple-sm">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-apple-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span className="text-xl font-bold text-apple-gray-800 dark:text-apple-gray-100">PressFlow</span>
            </Link>
            <div className="hidden md:flex space-x-6 items-center">
                <Link to="/" className="text-sm font-medium hover:text-apple-blue transition-colors">Home</Link>
                <Link to="/features" className="text-sm font-bold text-apple-blue transition-colors">Features</Link>
                <Link to="/pricing" className="text-sm font-medium hover:text-apple-blue transition-colors">Pricing</Link>
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

// --- Reusable Footer for Public Pages ---
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


// --- Reusable Detailed Feature Component ---
// This component alternates the position of the image and text
const DetailedFeature = ({ icon, title, description, imagePlaceholderColor, imageSide = 'left' }) => {
    const imageContent = (
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div className={`w-full h-72 rounded-apple-xl shadow-apple-lg flex items-center justify-center ${imagePlaceholderColor}`}>
                <p className="text-apple-gray-500 font-medium">[ Image of {title} Feature ]</p>
            </div>
        </div>
    );

    const textContent = (
        <div className="w-full lg:w-1/2 lg:p-12">
            <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-apple-blue/10 flex items-center justify-center mr-4">
                    {icon}
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-apple-gray-800 dark:text-white">{title}</h3>
            </div>
            <p className="text-lg text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">
                {description}
            </p>
        </div>
    );

    return (
        <div className={`flex flex-col lg:flex-row items-center ${imageSide === 'right' ? 'lg:flex-row-reverse' : ''}`}>
            {imageContent}
            {textContent}
        </div>
    );
};


const FeaturesPage = () => {
    return (
        <div className="bg-apple-gray-50 dark:bg-apple-gray-950">
            <PublicHeader />

            <main>
                {/* --- Page Header Section --- */}
                <section className="py-20 text-center bg-white dark:bg-apple-gray-900">
                    <div className="container mx-auto px-6">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-apple-gray-900 dark:text-white mb-3">
                            Features That Power Your Business
                        </h1>
                        <p className="text-lg text-apple-gray-600 dark:text-apple-gray-400 max-w-3xl mx-auto">
                            Discover the tools designed to make managing your pressing and laundry service simpler, faster, and more professional.
                        </p>
                    </div>
                </section>

                {/* --- Detailed Features List --- */}
                <div className="py-20 space-y-20 container mx-auto px-6">
                    <DetailedFeature
                        icon={<PackagePlus size={24} className="text-apple-blue" />}
                        title="Comprehensive Order Management"
                        description="Log every detail of an order with ease. Add multiple clothing items, specify services like 'Dry Clean' or 'Iron Only', set quantities, and include special instructions for delicate garments. Every order gets a unique receipt number for perfect tracking."
                        imagePlaceholderColor="bg-sky-200 dark:bg-sky-900"
                        imageSide="right"
                    />

                    <DetailedFeature
                        icon={<Users size={24} className="text-apple-blue" />}
                        title="Integrated Customer Database"
                        description="Build a relationship with your clients. Save customer contact information for quick order creation and view their complete history at any time. Our system helps you provide that personal touch."
                        imagePlaceholderColor="bg-teal-200 dark:bg-teal-900"
                        imageSide="left"
                    />

                    <DetailedFeature
                        icon={<CreditCard size={24} className="text-apple-blue" />}
                        title="Flexible Payment & Discount Tracking"
                        description="Handle finances with clarity. Record advance payments, apply percentage or fixed-amount discounts, and instantly see the balance due for any order. The system automatically tracks paid and unpaid statuses."
                        imagePlaceholderColor="bg-indigo-200 dark:bg-indigo-900"
                        imageSide="right"
                    />

                    <DetailedFeature
                        icon={<Bell size={24} className="text-apple-blue" />}
                        title="Automated Customer Notifications"
                        description="Stop spending time on the phone. PressFlow automatically sends an email or SMS to your customer the moment their order is marked 'Ready for Pickup', enhancing their experience and freeing up your time."
                        imagePlaceholderColor="bg-emerald-200 dark:bg-emerald-900"
                        imageSide="left"
                    />

                    <DetailedFeature
                        icon={<Clock size={24} className="text-apple-blue" />}
                        title="Date Tracking & Overdue Alerts"
                        description="Never lose track of a deadline. Set expected pickup dates and times for every order. The admin dashboard prominently flags any orders that are overdue, so you can take action immediately."
                        imagePlaceholderColor="bg-rose-200 dark:bg-rose-900"
                        imageSide="right"
                    />

                    <DetailedFeature
                        icon={<SlidersHorizontal size={24} className="text-apple-blue" />}
                        title="Customizable Admin Settings"
                        description="Make the application your own. From the Admin Area, you can customize company information for receipts, and modify the email templates sent to your customers for a fully branded experience."
                        imagePlaceholderColor="bg-slate-200 dark:bg-slate-800"
                        imageSide="left"
                    />
                     <DetailedFeature
                        icon={<Printer size={24} className="text-apple-blue" />}
                        title="Professional Printable Receipts"
                        description="Generate clean, itemized receipts for your customers with a single click. Each receipt includes a full breakdown of items, services, prices, discounts, and payment status, just like a modern supermarket."
                        imagePlaceholderColor="bg-cyan-200 dark:bg-cyan-900"
                        imageSide="right"
                    />
                </div>

                {/* --- CTA Section --- */}
                <section className="py-20 text-center bg-white dark:bg-apple-gray-900">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">See It In Action</h2>
                        <p className="text-lg text-apple-gray-600 dark:text-apple-gray-400 max-w-2xl mx-auto mb-8">
                            Ready to take control of your workflow? Start your free trial and experience the difference today.
                        </p>
                        <Link to="/signup">
                            <Button variant="primary" size="lg">Get Started for Free</Button>
                        </Link>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    );
};

export default FeaturesPage;