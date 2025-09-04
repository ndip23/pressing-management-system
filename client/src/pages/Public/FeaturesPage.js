// client/src/pages/Public/FeaturesPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/UI/Button'; // Assuming your Button component is here
import {  CreditCard, Bell, Users, SlidersHorizontal, PackagePlus, Clock, Printer } from 'lucide-react';

// --- Reusable Header/Navbar for Public Pages ---
// For consistency, you might want to move this into its own component later


// --- Reusable Footer for Public Pages ---



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

           
        </div>
    );
};

export default FeaturesPage;