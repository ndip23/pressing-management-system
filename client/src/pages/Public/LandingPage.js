// client/src/pages/Public/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart2, Bell, Smartphone, DollarSign, Zap, Users} from 'lucide-react';

const FeatureCard = ({ icon, title, description, delay }) => (
    <div
        data-aos="fade-up"
        data-aos-delay={delay}
        className="
            group
            bg-white dark:bg-apple-gray-900 p-6 rounded-apple-lg shadow-apple-md 
            border border-apple-gray-100 dark:border-apple-gray-800 
            transition-all duration-300 ease-apple transform
            hover:-translate-y-2 hover:shadow-apple-xl hover:border-apple-blue/30
        "
    >
        <div className="
            flex items-center justify-center h-12 w-12 rounded-full bg-apple-blue/10 mb-4 
            transition-transform duration-300 ease-apple 
            group-hover:scale-110
        ">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-apple-gray-800 dark:text-white mb-2">
            {title}
        </h3>
        <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">
            {description}
        </p>
    </div>
);


const LandingPage = () => {
    const { t } = useTranslation();
    
    return (
        <>
            {/* Hero Section */}
            <section 
                className="relative pt-10 pb-16 md:pt-16 md:pb-20 bg-apple-gray-50 dark:bg-apple-gray-900 text-center"
                data-aos="fade-in"
            >

                <div className="container mx-auto px-6">
                    <div className="max-w-2xl mx-auto">

                        {/* Animated Title */}
                        <h1 
                            data-aos="fade-up"
                            data-aos-delay="150"
                            className="text-4xl md:text-6xl font-bold text-apple-gray-900 dark:text-white mb-4 leading-tight"
                        >
                            {t('public.landing.hero.title')}{" "}
                            <span className="text-apple-blue">PressMark</span>
                        </h1>

                        {/* Subtitle */}
                        <p 
                            data-aos="fade-up"
                            data-aos-delay="250"
                            className="text-lg text-apple-gray-600 dark:text-apple-gray-300 mb-8"
                        >
                            {t('public.landing.hero.subtitle')}
                        </p>

                        {/* Buttons */}
                        <div 
                            className="flex flex-col sm:flex-row justify-center gap-4 sm:space-x-4"
                            data-aos="fade-up"
                            data-aos-delay="350"
                        >
                            <Link
                            to="/signup"
                            >
                                {t('public.landing.hero.getStartedFree')}
                            </Link>

                            <Link
                                to="/features"
                                className="bg-white dark:bg-apple-gray-800 text-apple-blue dark:text-white px-6 sm:px-8 py-3 rounded-apple font-semibold text-base sm:text-lg hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-transform transform hover:scale-105 shadow-apple-lg text-center"
                            >
                                {t('public.landing.hero.learnMore')}
                            </Link>
                        </div>

                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white dark:bg-apple-gray-950">
                <div className="container mx-auto px-6">
                    <div 
                        className="text-center mb-12"
                        data-aos="fade-up"
                    >
                        <h2 className="text-3xl font-bold text-apple-gray-800 dark:text-white">
                            {t('public.landing.features.title')}
                        </h2>
                        <p className="text-md text-apple-gray-500 dark:text-apple-gray-400 mt-2">
                            {t('public.landing.features.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            delay="100"
                            icon={<Zap size={24} className="text-apple-blue" />}
                            title={t('public.landing.features.orderManagement.title')}
                            description={t('public.landing.features.orderManagement.description')}
                        />
                        <FeatureCard
                            delay="200"
                            icon={<Bell size={24} className="text-apple-blue" />}
                            title={t('public.landing.features.notifications.title')}
                            description={t('public.landing.features.notifications.description')}
                        />
                        <FeatureCard
                            delay="300"
                            icon={<DollarSign size={24} className="text-apple-blue" />}
                            title={t('public.landing.features.payments.title')}
                            description={t('public.landing.features.payments.description')}
                        />
                        <FeatureCard
                            delay="400"
                            icon={<Users size={24} className="text-apple-blue" />}
                            title={t('public.landing.features.customers.title')}
                            description={t('public.landing.features.customers.description')}
                        />
                        <FeatureCard
                            delay="500"
                            icon={<BarChart2 size={24} className="text-apple-blue" />}
                            title={t('public.landing.features.dashboard.title')}
                            description={t('public.landing.features.dashboard.description')}
                        />
                        <FeatureCard
                            delay="600"
                            icon={<Smartphone size={24} className="text-apple-blue" />}
                            title={t('public.landing.features.access.title')}
                            description={t('public.landing.features.access.description')}
                        />
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="bg-apple-gray-100 dark:bg-apple-gray-900 py-20">
                <div 
                    className="container mx-auto px-6 text-center"
                    data-aos="fade-up"
                >
                    <h2 className="text-3xl font-bold text-apple-gray-800 dark:text-white">
                        {t('public.landing.cta.title')}
                    </h2>
                    <p className="text-lg text-apple-gray-600 dark:text-apple-gray-300 mt-2 mb-8">
                        {t('public.landing.cta.subtitle')}
                    </p>
                    <Link 
                        to="/signup" 
                        data-aos="zoom-in"
                        data-aos-delay="200"
                        className="inline-block bg-apple-blue text-white px-6 sm:px-10 py-3 sm:py-4 rounded-apple font-semibold text-base sm:text-lg hover:bg-sky-600 transition-transform transform hover:scale-105 shadow-apple-xl text-center whitespace-nowrap"
                    >
                        {t('public.landing.cta.startTrial')}
                    </Link>
                </div>
            </section>
        </>
    );
};

export default LandingPage;
