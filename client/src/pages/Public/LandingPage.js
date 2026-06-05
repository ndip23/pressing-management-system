// client/src/pages/Public/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    BarChart2, Bell, Smartphone, DollarSign, Zap, Users,
    ArrowRight, CheckCircle2, Sparkles, ShieldCheck, Clock, Star,
} from 'lucide-react';

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
            flex items-center justify-center h-12 w-12 rounded-2xl bg-apple-blue/10 mb-4
            transition-transform duration-300 ease-apple
            group-hover:scale-110 group-hover:bg-apple-blue/15
        ">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-apple-gray-800 dark:text-white mb-2">
            {title}
        </h3>
        <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">
            {description}
        </p>
    </div>
);

const StepCard = ({ step, title, description }) => (
    <div data-aos="fade-up" data-aos-delay={step * 100} className="relative text-center px-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-apple-blue text-white text-lg font-bold shadow-apple-md">
            {step}
        </div>
        <h3 className="text-lg font-semibold text-apple-gray-800 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400 leading-relaxed">{description}</p>
    </div>
);

const LandingPage = () => {
    const { t } = useTranslation();

    return (
        <>
            {/* ---------- HERO ---------- */}
            <section className="relative overflow-hidden bg-gradient-to-b from-apple-gray-50 to-white dark:from-apple-gray-950 dark:to-apple-gray-900">
                {/* decorative glow */}
                <div aria-hidden className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-apple-blue/20 blur-3xl" />
                    <div className="absolute top-40 -right-20 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
                </div>

                <div className="relative container mx-auto px-6 pt-12 pb-20 md:pt-20 md:pb-28 text-center">
                    {/* Promo / badge */}
                    <div
                        data-aos="zoom-in"
                        className="inline-flex items-center gap-2 rounded-full border border-apple-blue/20 bg-apple-blue/10 px-4 py-1.5 text-sm font-medium text-apple-blue mb-8"
                    >
                        <Sparkles size={16} />
                        <span>{t('public.landing.banner.promo')}</span>
                    </div>

                    <div className="max-w-3xl mx-auto">
                        <img
                            src="/logo.png"
                            alt="PressMark"
                            data-aos="fade-down"
                            className="mx-auto mb-6 h-16 w-16 rounded-2xl object-contain shadow-apple-md"
                        />

                        <h1
                            data-aos="fade-up"
                            data-aos-delay="100"
                            className="text-4xl md:text-6xl font-bold tracking-tight text-apple-gray-900 dark:text-white mb-5 leading-[1.1]"
                        >
                            {t('public.landing.hero.title')}{' '}
                            <span className="bg-gradient-to-r from-apple-blue to-sky-500 bg-clip-text text-transparent">
                                PressMark
                            </span>
                        </h1>

                        <p
                            data-aos="fade-up"
                            data-aos-delay="200"
                            className="text-lg md:text-xl text-apple-gray-600 dark:text-apple-gray-300 mb-9 max-w-2xl mx-auto leading-relaxed"
                        >
                            {t('public.landing.hero.subtitle')}
                        </p>

                        <div
                            className="flex flex-col sm:flex-row justify-center gap-3"
                            data-aos="fade-up"
                            data-aos-delay="300"
                        >
                            <Link
                                to="/signup"
                                className="group inline-flex items-center justify-center gap-2 bg-apple-blue text-white px-8 py-3.5 rounded-apple font-semibold text-base shadow-apple-lg hover:bg-apple-blue-dark transition-all transform hover:scale-[1.03]"
                            >
                                {t('public.landing.hero.getStartedFree')}
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </Link>

                            <Link
                                to="/features"
                                className="inline-flex items-center justify-center bg-white dark:bg-apple-gray-800 text-apple-gray-800 dark:text-white px-8 py-3.5 rounded-apple font-semibold text-base border border-apple-gray-200 dark:border-apple-gray-700 hover:border-apple-blue/40 hover:bg-apple-gray-50 dark:hover:bg-apple-gray-700 transition-all transform hover:scale-[1.03] shadow-apple-sm"
                            >
                                {t('public.landing.hero.learnMore')}
                            </Link>
                        </div>

                        {/* trust line */}
                        <div
                            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-apple-gray-500 dark:text-apple-gray-400"
                            data-aos="fade-up"
                            data-aos-delay="400"
                        >
                            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-apple-green" /> {t('public.landing.trust.noCard', 'No credit card required')}</span>
                            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-apple-green" /> {t('public.landing.trust.freeTrial', '30-day free trial')}</span>
                            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-apple-green" /> {t('public.landing.trust.cancel', 'Cancel anytime')}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------- STATS STRIP ---------- */}
            <section className="bg-apple-blue">
                <div className="container mx-auto px-6 py-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
                        {[
                            { value: '10k+', label: t('public.landing.stats.orders', 'Orders processed') },
                            { value: '500+', label: t('public.landing.stats.businesses', 'Businesses onboard') },
                            { value: '99.9%', label: t('public.landing.stats.uptime', 'Uptime') },
                            { value: '24/7', label: t('public.landing.stats.support', 'Support') },
                        ].map((s, i) => (
                            <div key={i} data-aos="fade-up" data-aos-delay={i * 100}>
                                <p className="text-3xl md:text-4xl font-bold">{s.value}</p>
                                <p className="mt-1 text-sm text-sky-100">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------- HOW IT WORKS ---------- */}
            <section className="py-20 bg-white dark:bg-apple-gray-950">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-14" data-aos="fade-up">
                        <h2 className="text-3xl font-bold text-apple-gray-800 dark:text-white">
                            {t('public.landing.how.title', 'Up and running in minutes')}
                        </h2>
                        <p className="text-md text-apple-gray-500 dark:text-apple-gray-400 mt-2">
                            {t('public.landing.how.subtitle', 'Three simple steps to modernise your laundry business.')}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
                        <StepCard step={1} title={t('public.landing.how.step1.title', 'Create your account')} description={t('public.landing.how.step1.description', 'Sign up in under a minute and land straight on your dashboard.')} />
                        <StepCard step={2} title={t('public.landing.how.step2.title', 'Fund your wallet')} description={t('public.landing.how.step2.description', 'Top up your pay-as-you-go wallet to unlock every feature instantly.')} />
                        <StepCard step={3} title={t('public.landing.how.step3.title', 'Start managing orders')} description={t('public.landing.how.step3.description', 'Log orders, notify customers and track payments — all in one place.')} />
                    </div>
                </div>
            </section>

            {/* ---------- FEATURES ---------- */}
            <section id="features" className="py-20 bg-apple-gray-50 dark:bg-apple-gray-900">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12" data-aos="fade-up">
                        <h2 className="text-3xl font-bold text-apple-gray-800 dark:text-white">
                            {t('public.landing.features.title')}
                        </h2>
                        <p className="text-md text-apple-gray-500 dark:text-apple-gray-400 mt-2">
                            {t('public.landing.features.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard delay="100" icon={<Zap size={24} className="text-apple-blue" />} title={t('public.landing.features.orderManagement.title')} description={t('public.landing.features.orderManagement.description')} />
                        <FeatureCard delay="200" icon={<Bell size={24} className="text-apple-blue" />} title={t('public.landing.features.notifications.title')} description={t('public.landing.features.notifications.description')} />
                        <FeatureCard delay="300" icon={<DollarSign size={24} className="text-apple-blue" />} title={t('public.landing.features.payments.title')} description={t('public.landing.features.payments.description')} />
                        <FeatureCard delay="400" icon={<Users size={24} className="text-apple-blue" />} title={t('public.landing.features.customers.title')} description={t('public.landing.features.customers.description')} />
                        <FeatureCard delay="500" icon={<BarChart2 size={24} className="text-apple-blue" />} title={t('public.landing.features.dashboard.title')} description={t('public.landing.features.dashboard.description')} />
                        <FeatureCard delay="600" icon={<Smartphone size={24} className="text-apple-blue" />} title={t('public.landing.features.access.title')} description={t('public.landing.features.access.description')} />
                    </div>
                </div>
            </section>

            {/* ---------- SOCIAL PROOF ---------- */}
            <section className="py-20 bg-white dark:bg-apple-gray-950">
                <div className="container mx-auto px-6 max-w-3xl text-center" data-aos="fade-up">
                    <div className="flex justify-center gap-1 mb-5 text-amber-400">
                        {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
                    </div>
                    <blockquote className="text-xl md:text-2xl font-medium text-apple-gray-800 dark:text-white leading-relaxed">
                        “{t('public.landing.quote.text', 'PressMark replaced our paper tickets and three spreadsheets. Orders, payments and customer alerts now live in one clean dashboard.')}”
                    </blockquote>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-apple-blue/10 text-apple-blue font-semibold">SK</div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-apple-gray-900 dark:text-white">{t('public.landing.quote.author', 'Sarah K.')}</p>
                            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">{t('public.landing.quote.role', 'Owner, Crisp & Clean Laundry')}</p>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-apple-gray-500 dark:text-apple-gray-400">
                        <span className="inline-flex items-center gap-2"><ShieldCheck size={18} className="text-apple-green" /> {t('public.landing.badges.secure', 'Bank-grade security')}</span>
                        <span className="inline-flex items-center gap-2"><Clock size={18} className="text-apple-blue" /> {t('public.landing.badges.fast', 'Set up in minutes')}</span>
                        <span className="inline-flex items-center gap-2"><Smartphone size={18} className="text-apple-blue" /> {t('public.landing.badges.anywhere', 'Works on any device')}</span>
                    </div>
                </div>
            </section>

            {/* ---------- CTA ---------- */}
            <section className="bg-apple-gray-100 dark:bg-apple-gray-900 py-20">
                <div className="container mx-auto px-6" data-aos="fade-up">
                    <div className="relative overflow-hidden rounded-apple-lg bg-gradient-to-r from-apple-blue to-sky-600 px-6 py-14 text-center shadow-apple-xl">
                        <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                        <h2 className="relative text-3xl font-bold text-white">
                            {t('public.landing.cta.title')}
                        </h2>
                        <p className="relative text-lg text-sky-100 mt-2 mb-8 max-w-2xl mx-auto">
                            {t('public.landing.cta.subtitle')}
                        </p>
                        <Link
                            to="/signup"
                            className="relative inline-flex items-center justify-center gap-2 bg-white text-apple-blue px-10 py-4 rounded-apple font-semibold text-lg hover:bg-apple-gray-50 transition-transform transform hover:scale-105 shadow-apple-xl whitespace-nowrap"
                        >
                            {t('public.landing.cta.startTrial')}
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
};

export default LandingPage;
