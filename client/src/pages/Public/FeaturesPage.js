// client/src/pages/Public/FeaturesPage.js

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../../components/UI/Button';
import { CreditCard, Bell, Users, SlidersHorizontal, PackagePlus, Clock, Printer } from 'lucide-react';
import { motion } from 'framer-motion'; // <-- Import motion for animations

// --- UPDATED Detailed Feature Component ---
// It now accepts an `imageUrl` prop and renders an actual image.
const DetailedFeature = ({ icon, title, description, imageUrl, imageAlt, imageSide = 'left' }) => {
    
    // The text content remains the same
    const textContent = (
        <motion.div 
            className="w-full lg:w-1/2 lg:p-12"
            initial={{ opacity: 0, x: imageSide === 'right' ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
        >
            <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-apple-blue/10 flex items-center justify-center mr-4">
                    {icon}
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-apple-gray-800 dark:text-white">{title}</h3>
            </div>
            <p className="text-lg text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">
                {description}
            </p>
        </motion.div>
    );

    // The image content now renders a real image
    const imageContent = (
        <motion.div 
            className="w-full lg:w-1/2 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
        >
            <img 
                src={imageUrl} 
                alt={imageAlt} 
                className="rounded-apple-xl shadow-apple-lg w-full h-auto object-cover"
            />
        </motion.div>
    );

    return (
        <div className={`flex flex-col lg:flex-row items-center gap-8 ${imageSide === 'right' ? 'lg:flex-row-reverse' : ''}`}>
            {imageContent}
            {textContent}
        </div>
    );
};


const FeaturesPage = () => {
    const { t } = useTranslation();
    
    return (
        <div className="bg-apple-gray-50 dark:bg-apple-gray-950">
            <main>
                {/* --- Page Header Section --- */}
                <section className="py-20 text-center bg-white dark:bg-apple-gray-900">
                    <div className="container mx-auto px-6">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-apple-gray-900 dark:text-white mb-3">
                            {t('public.features.title')}
                        </h1>
                        <p className="text-lg text-apple-gray-600 dark:text-apple-gray-400 max-w-3xl mx-auto">
                            {t('public.features.subtitle')}
                        </p>
                    </div>
                </section>

                {/* --- Detailed Features List --- */}
                <div className="py-20 space-y-20 container mx-auto px-6">
                    <DetailedFeature
                        icon={<PackagePlus size={24} className="text-apple-blue" />}
                        title={t('public.features.orderManagement.title')}
                        description={t('public.features.orderManagement.description')}
                        imageUrl="/images/feature-order-management.png"
                        imageAlt="Order Management Screenshot"
                        imageSide="right"
                    />

                    <DetailedFeature
                        icon={<Users size={24} className="text-apple-blue" />}
                        title={t('public.features.customerDatabase.title')}
                        description={t('public.features.customerDatabase.description')}
                        imageUrl="/images/feature-customer-database.png"
                        imageAlt="Customer Database Screenshot"
                        imageSide="left"
                    />

                    <DetailedFeature
                        icon={<CreditCard size={24} className="text-apple-blue" />}
                        title={t('public.features.paymentTracking.title')}
                        description={t('public.features.paymentTracking.description')}
                        imageUrl="/images/feature-payment-tracking.png"
                        imageAlt="Payment Tracking Screenshot"
                        imageSide="right"
                    />

                    {/* These features will still show placeholders until you create images for them */}
                    <DetailedFeature
                        icon={<Bell size={24} className="text-apple-blue" />}
                        title={t('public.features.notifications.title')}
                        description={t('public.features.notifications.description')}
                        imageUrl="/images/placeholder-notifications.png" // Placeholder
                        imageAlt="Automated Customer Notifications"
                        imageSide="left"
                    />
                    <DetailedFeature
                        icon={<Clock size={24} className="text-apple-blue" />}
                        title={t('public.features.dateTracking.title')}
                        description={t('public.features.dateTracking.description')}
                        imageUrl="/images/placeholder-date-tracking.png" // Placeholder
                        imageAlt="Date and Overdue Tracking"
                        imageSide="right"
                    />
                    <DetailedFeature
                        icon={<SlidersHorizontal size={24} className="text-apple-blue" />}
                        title={t('public.features.adminSettings.title')}
                        description={t('public.features.adminSettings.description')}
                       imageUrl="/images/admin-settings.png" 
                       imageAlt="Admin Settings Screenshot"
                        imageSide="left"
                    />
                     <DetailedFeature
                        icon={<Printer size={24} className="text-apple-blue" />}
                        title={t('public.features.receipts.title')}
                        description={t('public.features.receipts.description')}
                        imageUrl="/images/feature-receipts-invoices.png"
                        imageAlt="Receipts and Invoices Screenshot"
                        imageSide="right"
                    />
                </div>

                {/* --- CTA Section --- */}
                <section className="py-20 text-center bg-white dark:bg-apple-gray-900">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">{t('public.features.cta.title')}</h2>
                        <p className="text-lg text-apple-gray-600 dark:text-apple-gray-400 max-w-2xl mx-auto mb-8">
                            {t('public.features.cta.subtitle')}
                        </p>
                        <Link to="/signup">
                            <Button variant="primary" size="lg">{t('public.features.cta.getStartedFree')}</Button>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default FeaturesPage;