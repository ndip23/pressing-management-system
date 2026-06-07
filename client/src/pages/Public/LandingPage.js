// client/src/pages/Public/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
    BarChart2, Bell, Smartphone, DollarSign, Zap, Users, 
    ArrowRight, CheckCircle2, ShieldCheck, Globe, PlayCircle 
} from 'lucide-react';

const FeatureCard = ({ icon, title, description, delay }) => (
    <div
        data-aos="fade-up"
        data-aos-delay={delay}
        className="group relative bg-white dark:bg-apple-gray-900 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-apple-sm border border-apple-gray-100 dark:border-apple-gray-800 transition-all duration-500 hover:-translate-y-3 hover:shadow-apple-xl hover:border-apple-blue/20"
    >
        <div className="flex items-center justify-center h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-apple-blue/10 text-apple-blue mb-4 md:mb-6 transition-all duration-500 group-hover:bg-apple-blue group-hover:text-white">
            {icon}
        </div>
        <h3 className="text-lg md:text-xl font-bold text-apple-gray-900 dark:text-white mb-2 md:mb-3 tracking-tight">
            {title}
        </h3>
        <p className="text-xs md:text-sm leading-relaxed text-apple-gray-600 dark:text-apple-gray-400">
            {description}
        </p>
    </div>
);

const LandingPage = () => {
    const { t } = useTranslation();
    
    return (
        <div className="overflow-x-hidden">
            {/* HERO SECTION */}
            <section className="relative  bg-white dark:bg-apple-gray-950 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                    <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] bg-apple-blue/5 rounded-full blur-[80px] md:blur-[120px]" />
                    <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[60%] bg-sky-400/5 rounded-full blur-[80px] md:blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
                    <div className="max-w-4xl mx-auto">
                        <div 
                            data-aos="fade-down"
                            className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-apple-blue/10 text-apple-blue rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-6 md:mb-8"
                        >
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-apple-blue animate-pulse" />
                            {t('public.landing.hero.badge') || "The Future of Laundry Management"}
                        </div>

                        <h1 
                            data-aos="zoom-out-up"
                            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-apple-gray-900 dark:text-white mb-6 md:mb-8 leading-[1.1] tracking-tighter"
                        >
                            {t('public.landing.hero.title')}{" "}
                            <span className="text-apple-blue block sm:inline">PressMark.</span>
                        </h1>

                        <p 
                            data-aos="fade-up"
                            data-aos-delay="200"
                            className="text-base md:text-xl lg:text-2xl text-apple-gray-500 dark:text-apple-gray-400 mb-8 md:mb-12 max-w-2xl mx-auto font-medium leading-relaxed"
                        >
                            {t('public.landing.hero.subtitle')}
                        </p>

                        <div 
                            data-aos="fade-up" 
                            data-aos-delay="400"
                            className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 px-4"
                        >
                            <Link
                                to="/signup"
                                className="group flex items-center justify-center gap-3 bg-apple-blue text-white px-8 py-4 md:px-10 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-apple-lg hover:shadow-apple-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                {t('public.landing.hero.getStartedFree')}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                to="/features"
                                className="flex items-center justify-center gap-3 bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-900 dark:text-white px-8 py-4 md:px-10 md:py-5 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 transition-all duration-300"
                            >
                                <PlayCircle size={22} className="text-apple-blue" />
                                {t('public.landing.hero.learnMore')}
                            </Link>
                        </div>
                    </div>

                    {/* Dashboard Preview Mockup */}
                    <div 
                        data-aos="fade-up"
                        data-aos-delay="600"
                        className="mt-12 md:mt-20 max-w-6xl mx-auto px-2 md:px-4"
                    >
                        <div className="relative p-1 md:p-2 rounded-[1.5rem] md:rounded-[2.5rem] bg-apple-gray-100 dark:bg-apple-gray-800 border border-apple-gray-200 dark:border-apple-gray-700 shadow-2xl">
                            <div className="bg-white dark:bg-apple-gray-900 rounded-[1.2rem] md:rounded-[2rem] aspect-[4/3] sm:aspect-video overflow-hidden border border-apple-gray-200 dark:border-apple-gray-700 shadow-inner flex flex-col text-left">
                                {/* Simulated App Header */}
                                <div className="h-8 md:h-12 border-b border-apple-gray-100 dark:border-apple-gray-800 flex items-center px-4 md:px-6 gap-1.5 md:gap-2">
                                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-400" />
                                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-amber-400" />
                                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-400" />
                                    <div className="ml-2 md:ml-4 h-3 md:h-4 w-24 md:w-40 bg-apple-gray-50 dark:bg-apple-gray-800 rounded-full" />
                                </div>
                                {/* Simulated Content */}
                                <div className="flex-1 p-4 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 opacity-40">
                                    <div className="h-20 md:h-32 bg-apple-gray-50 dark:bg-apple-gray-800 rounded-lg md:rounded-2xl" />
                                    <div className="h-20 md:h-32 bg-apple-gray-50 dark:bg-apple-gray-800 rounded-lg md:rounded-2xl" />
                                    <div className="hidden md:block h-32 bg-apple-gray-50 dark:bg-apple-gray-800 rounded-2xl" />
                                    <div className="hidden md:block h-32 bg-apple-gray-50 dark:bg-apple-gray-800 rounded-2xl" />
                                    <div className="col-span-2 md:col-span-3 h-40 md:h-64 bg-apple-gray-50 dark:bg-apple-gray-800 rounded-lg md:rounded-2xl" />
                                    <div className="hidden md:block h-64 bg-apple-gray-50 dark:bg-apple-gray-800 rounded-2xl" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center bg-white/5 dark:bg-black/5 backdrop-blur-[1px]">
                                    <div className="px-5 py-3 md:px-8 md:py-4 bg-white/90 dark:bg-apple-gray-800/90 rounded-full shadow-2xl border border-apple-gray-100 dark:border-apple-gray-700 font-bold text-sm md:text-xl flex items-center gap-2 md:gap-3">
                                        <ShieldCheck className="text-apple-green w-5 h-5 md:w-6 md:h-6" /> {t('public.landing.hero.previewLabel') || "Real-time Order Tracking"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="py-12 md:py-20 bg-apple-gray-50 dark:bg-apple-gray-900/50">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {[
                            { label: "Orders Processed", val: "1.2M+" },
                            { label: "Active Businesses", val: "500+" },
                            { label: "Support Response", val: "< 15m" },
                            { label: "Up-time Guarantee", val: "99.9%" },
                        ].map((stat, i) => (
                            <div key={i} data-aos="fade-up" data-aos-delay={i * 100} className="text-center">
                                <p className="text-2xl md:text-4xl font-black text-apple-blue mb-1 md:mb-2">{stat.val}</p>
                                <p className="text-[10px] md:text-sm font-bold text-apple-gray-500 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section id="features" className="py-16 md:py-24 bg-white dark:bg-apple-gray-950">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-12 md:mb-20 max-w-3xl mx-auto" data-aos="fade-up">
                        <h2 className="text-3xl md:text-5xl font-black text-apple-gray-900 dark:text-white tracking-tight mb-4 md:mb-6">
                            {t('public.landing.features.title')}
                        </h2>
                        <p className="text-base md:text-xl text-apple-gray-500 dark:text-apple-gray-400 font-medium">
                            {t('public.landing.features.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                        <FeatureCard
                            delay="100"
                            icon={<Zap size={28} />}
                            title={t('public.landing.features.orderManagement.title')}
                            description={t('public.landing.features.orderManagement.description')}
                        />
                        <FeatureCard
                            delay="200"
                            icon={<Bell size={28} />}
                            title={t('public.landing.features.notifications.title')}
                            description={t('public.landing.features.notifications.description')}
                        />
                        <FeatureCard
                            delay="300"
                            icon={<DollarSign size={28} />}
                            title={t('public.landing.features.payments.title')}
                            description={t('public.landing.features.payments.description')}
                        />
                        <FeatureCard
                            delay="400"
                            icon={<Users size={28} />}
                            title={t('public.landing.features.customers.title')}
                            description={t('public.landing.features.customers.description')}
                        />
                        <FeatureCard
                            delay="500"
                            icon={<BarChart2 size={28} />}
                            title={t('public.landing.features.dashboard.title')}
                            description={t('public.landing.features.dashboard.description')}
                        />
                        <FeatureCard
                            delay="600"
                            icon={<Smartphone size={28} />}
                            title={t('public.landing.features.access.title')}
                            description={t('public.landing.features.access.description')}
                        />
                    </div>
                </div>
            </section>

            {/* TRUST SECTION */}
            <section className="py-16 md:py-24 bg-apple-gray-50 dark:bg-apple-gray-900">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                        <div className="lg:w-1/2 order-2 lg:order-1" data-aos="fade-right">
                            <h2 className="text-3xl md:text-5xl font-black text-apple-gray-900 dark:text-white mb-6 md:mb-8 leading-tight">
                                Built for the <span className="text-apple-blue">Modern Owner.</span>
                            </h2>
                            <div className="space-y-4 md:space-y-6">
                                {[
                                    { t: "Automated Ticket Generation", d: "Instantly create print-ready tickets for your staff." },
                                    { t: "End-to-End Encryption", d: "Your business data and customer info are military-grade secure." },
                                    { t: "Global Directory Listing", d: "Get found by customers looking for laundry services near them." }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-3 md:gap-4 group">
                                        <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-apple-green/10 text-apple-green flex items-center justify-center group-hover:bg-apple-green group-hover:text-white transition-colors">
                                            <CheckCircle2 size={14} className="md:w-4 md:h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-apple-gray-900 dark:text-white text-base md:text-lg">{item.t}</h4>
                                            <p className="text-xs md:text-sm text-apple-gray-500 dark:text-apple-gray-400">{item.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 order-1 lg:order-2 relative px-4" data-aos="fade-left">
                            <div className="rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white dark:border-apple-gray-800">
                                <img 
                                    src="https://images.unsplash.com/photo-1545173168-9f1947e96a36?auto=format&fit=crop&q=80&w=1000" 
                                    alt="Modern Laundry" 
                                    className="w-full h-64 sm:h-96 lg:h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -left-2 md:-bottom-10 md:-left-10 p-4 md:p-8 bg-apple-blue text-white rounded-xl md:rounded-[2rem] shadow-2xl">
                                <p className="text-2xl md:text-4xl font-black mb-0.5">30%</p>
                                <p className="text-[10px] md:text-sm font-bold opacity-80 uppercase tracking-widest">Efficiency Boost</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION SECTION */}
            <section className="py-20 md:py-32 bg-white dark:bg-apple-gray-950 text-center relative overflow-hidden px-4">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                    <Globe size={800} className="absolute -bottom-1/2 -right-1/4 text-apple-blue hidden md:block" />
                </div>

                <div className="container mx-auto px-4 relative z-10" data-aos="zoom-in">
                    <div className="max-w-4xl mx-auto bg-apple-gray-50 dark:bg-apple-gray-900 p-8 md:p-20 rounded-[2.5rem] md:rounded-[4rem] border border-apple-gray-200 dark:border-apple-gray-800 shadow-xl">
                        <h2 className="text-3xl md:text-6xl font-black text-apple-gray-900 dark:text-white mb-4 md:mb-6 tracking-tighter">
                            {t('public.landing.cta.title')}
                        </h2>
                        <p className="text-base md:text-xl text-apple-gray-500 dark:text-apple-gray-400 mb-8 md:mb-12 max-w-xl mx-auto font-medium">
                            {t('public.landing.cta.subtitle')}
                        </p>
                        <Link 
                            to="/signup" 
                            className="inline-flex items-center gap-3 md:gap-4 bg-apple-blue text-white px-8 py-4 md:px-12 md:py-6 rounded-full font-black text-lg md:text-xl hover:shadow-apple-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            {t('public.landing.cta.startTrial')}
                            <Zap size={24} fill="currentColor" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;