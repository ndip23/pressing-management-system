// client/src/pages/Public/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    BarChart2, Bell, Smartphone, DollarSign, Zap, Users,
    ArrowRight, CheckCircle2, Sparkles, ShieldCheck, Clock, Star,
    TrendingUp, ClipboardList, Wallet,
} from 'lucide-react';

/* ----------------------------- motion helpers ----------------------------- */
const Float = ({ children, delay = 0, duration = 6, distance = 14, className = '' }) => (
    <motion.div
        className={className}
        animate={{ y: [0, -distance, 0] }}
        transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
        {children}
    </motion.div>
);

const rise = {
    hidden: { opacity: 0, y: 28 },
    show: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 },
    }),
};

/* ------------------------------- feature card ----------------------------- */
const FeatureCard = ({ icon, title, description, i }) => (
    <motion.div
        custom={i}
        variants={rise}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        whileHover={{ y: -8 }}
        className="group relative rounded-3xl p-6 bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18)] transition-shadow hover:shadow-[0_18px_60px_-12px_rgba(56,116,255,0.35)]"
    >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/40 to-transparent dark:from-white/[0.04] pointer-events-none" />
        <div className="relative">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-apple-blue to-sky-400 text-white mb-4 shadow-lg shadow-apple-blue/30 transition-transform group-hover:scale-110">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-apple-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-apple-gray-600 dark:text-apple-gray-300 leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

/* ------------------------------- glass tile ------------------------------- */
const GlassTile = ({ icon, label, value, accent }) => (
    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-3 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>{icon}</div>
        <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-white/60">{label}</p>
            <p className="text-sm font-semibold text-white truncate">{value}</p>
        </div>
    </div>
);

const LandingPage = () => {
    const { t } = useTranslation();

    return (
        <div className="relative">
            {/* =================================================================== */}
            {/* HERO — futuristic, floating                                          */}
            {/* =================================================================== */}
            <section className="relative overflow-hidden bg-[#070b1a]">
                {/* gradient base */}
                <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#070b1a] via-[#0b1230] to-[#0a1024]" />

                {/* grid overlay */}
                <div
                    aria-hidden
                    className="absolute inset-0 opacity-[0.18]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                        backgroundSize: '46px 46px',
                        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 35%, black 40%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 35%, black 40%, transparent 100%)',
                    }}
                />

                {/* drifting orbs */}
                <motion.div
                    aria-hidden
                    className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-apple-blue/40 blur-[100px]"
                    animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    aria-hidden
                    className="absolute top-10 right-0 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-[110px]"
                    animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    aria-hidden
                    className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-400/20 blur-[110px]"
                    animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
                    transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                />

                <div className="relative container mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32">
                    <div className="max-w-3xl mx-auto text-center">
                        {/* badge */}
                        <motion.div
                            variants={rise} initial="hidden" animate="show"
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-medium text-sky-100 mb-8"
                        >
                            <Sparkles size={16} className="text-sky-300" />
                            <span>{t('public.landing.banner.promo')}</span>
                        </motion.div>

                        {/* floating logo */}
                        <Float duration={7} distance={10} className="mx-auto mb-6 w-fit">
                            <div className="relative">
                                <div className="absolute inset-0 blur-2xl bg-apple-blue/50 rounded-3xl" />
                                <img src="/logo.png" alt="PressMark" className="relative h-16 w-16 rounded-2xl object-contain ring-1 ring-white/20 shadow-2xl" />
                            </div>
                        </Float>

                        <motion.h1
                            custom={1} variants={rise} initial="hidden" animate="show"
                            className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.05] mb-5"
                        >
                            {t('public.landing.hero.title')}{' '}
                            <span className="bg-gradient-to-r from-sky-300 via-apple-blue to-fuchsia-400 bg-clip-text text-transparent">
                                PressMark
                            </span>
                        </motion.h1>

                        <motion.p
                            custom={2} variants={rise} initial="hidden" animate="show"
                            className="text-lg md:text-xl text-slate-300 mb-9 max-w-2xl mx-auto leading-relaxed"
                        >
                            {t('public.landing.hero.subtitle')}
                        </motion.p>

                        <motion.div
                            custom={3} variants={rise} initial="hidden" animate="show"
                            className="flex flex-col sm:flex-row justify-center gap-3"
                        >
                            <Link
                                to="/signup"
                                className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-base text-white bg-gradient-to-r from-apple-blue to-sky-500 shadow-lg shadow-apple-blue/40 hover:shadow-apple-blue/60 transition-all hover:-translate-y-0.5"
                            >
                                {t('public.landing.hero.getStartedFree')}
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                to="/features"
                                className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl font-semibold text-base text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all hover:-translate-y-0.5"
                            >
                                {t('public.landing.hero.learnMore')}
                            </Link>
                        </motion.div>

                        <motion.div
                            custom={4} variants={rise} initial="hidden" animate="show"
                            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400"
                        >
                            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-400" /> {t('public.landing.trust.noCard', 'No credit card required')}</span>
                            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-400" /> {t('public.landing.trust.freeTrial', '30-day free trial')}</span>
                            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-400" /> {t('public.landing.trust.cancel', 'Cancel anytime')}</span>
                        </motion.div>
                    </div>

                    {/* floating glass dashboard preview */}
                    <div className="relative mt-16 md:mt-20 max-w-4xl mx-auto">
                        {/* floating mini pills */}
                        <Float duration={5} distance={16} delay={0.2} className="absolute -left-2 sm:-left-8 top-6 z-20 hidden sm:block">
                            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 shadow-xl">
                                <p className="text-[11px] text-white/60 flex items-center gap-1.5"><TrendingUp size={13} className="text-emerald-400" /> Today's sales</p>
                                <p className="text-lg font-bold text-white">+$1,250</p>
                            </div>
                        </Float>
                        <Float duration={6.5} distance={18} delay={0.6} className="absolute -right-2 sm:-right-10 top-24 z-20 hidden sm:block">
                            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 shadow-xl">
                                <p className="text-[11px] text-white/60 flex items-center gap-1.5"><Bell size={13} className="text-sky-300" /> Ready for pickup</p>
                                <p className="text-lg font-bold text-white">8 orders</p>
                            </div>
                        </Float>

                        <Float duration={9} distance={12}>
                            <motion.div
                                initial={{ opacity: 0, y: 40, rotateX: 12 }}
                                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                                className="relative rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-2xl p-5 sm:p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
                            >
                                {/* window chrome */}
                                <div className="flex items-center gap-2 mb-5">
                                    <span className="h-3 w-3 rounded-full bg-red-400/80" />
                                    <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                                    <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                                    <span className="ml-3 text-xs text-white/50">PressMark · Dashboard</span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                    <GlassTile icon={<ClipboardList size={16} className="text-white" />} label="Total orders" value="1,284" accent="bg-apple-blue/40" />
                                    <GlassTile icon={<Clock size={16} className="text-white" />} label="Pending" value="42" accent="bg-amber-500/40" />
                                    <GlassTile icon={<CheckCircle2 size={16} className="text-white" />} label="Ready" value="8" accent="bg-emerald-500/40" />
                                    <GlassTile icon={<Wallet size={16} className="text-white" />} label="Wallet" value="$320.00" accent="bg-fuchsia-500/40" />
                                </div>

                                {/* fake chart */}
                                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                    <div className="flex items-end gap-2 h-28">
                                        {[42, 65, 38, 80, 55, 92, 70, 60, 85, 48, 75, 95].map((h, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ height: 0 }}
                                                whileInView={{ height: `${h}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.6, delay: idx * 0.05, ease: 'easeOut' }}
                                                className="flex-1 rounded-t-md bg-gradient-to-t from-apple-blue/40 to-sky-300/90"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </Float>
                    </div>
                </div>

                {/* bottom fade into next section */}
                <div aria-hidden className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-transparent to-apple-gray-50 dark:to-apple-gray-950" />
            </section>

            {/* =================================================================== */}
            {/* STATS                                                                */}
            {/* =================================================================== */}
            <section className="relative bg-apple-gray-50 dark:bg-apple-gray-950 py-14">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { value: '10k+', label: t('public.landing.stats.orders', 'Orders processed') },
                            { value: '500+', label: t('public.landing.stats.businesses', 'Businesses onboard') },
                            { value: '99.9%', label: t('public.landing.stats.uptime', 'Uptime') },
                            { value: '24/7', label: t('public.landing.stats.support', 'Support') },
                        ].map((s, i) => (
                            <motion.div
                                key={i} custom={i} variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }}
                                whileHover={{ y: -6 }}
                                className="rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-apple-md p-6 text-center"
                            >
                                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-apple-blue to-sky-500 bg-clip-text text-transparent">{s.value}</p>
                                <p className="mt-1 text-sm text-apple-gray-500 dark:text-apple-gray-400">{s.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* =================================================================== */}
            {/* HOW IT WORKS                                                         */}
            {/* =================================================================== */}
            <section className="relative bg-apple-gray-50 dark:bg-apple-gray-950 py-20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold text-apple-gray-900 dark:text-white">{t('public.landing.how.title', 'Up and running in minutes')}</h2>
                        <p className="text-md text-apple-gray-500 dark:text-apple-gray-400 mt-2">{t('public.landing.how.subtitle', 'Three simple steps to modernise your laundry business.')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {[
                            { t: t('public.landing.how.step1.title', 'Create your account'), d: t('public.landing.how.step1.description', 'Sign up in under a minute and land straight on your dashboard.') },
                            { t: t('public.landing.how.step2.title', 'Fund your wallet'), d: t('public.landing.how.step2.description', 'Top up your pay-as-you-go wallet to unlock every feature instantly.') },
                            { t: t('public.landing.how.step3.title', 'Start managing orders'), d: t('public.landing.how.step3.description', 'Log orders, notify customers and track payments — all in one place.') },
                        ].map((step, i) => (
                            <motion.div
                                key={i} custom={i} variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }}
                                whileHover={{ y: -8 }}
                                className="relative rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-apple-md p-7 text-center"
                            >
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-apple-blue to-sky-400 text-white text-lg font-bold shadow-lg shadow-apple-blue/30">
                                    {i + 1}
                                </div>
                                <h3 className="text-lg font-semibold text-apple-gray-900 dark:text-white mb-2">{step.t}</h3>
                                <p className="text-sm text-apple-gray-600 dark:text-apple-gray-300 leading-relaxed">{step.d}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* =================================================================== */}
            {/* FEATURES                                                             */}
            {/* =================================================================== */}
            <section id="features" className="relative overflow-hidden bg-white dark:bg-apple-gray-900 py-20">
                <div aria-hidden className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-apple-blue/10 blur-3xl" />
                <div className="relative container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-apple-gray-900 dark:text-white">{t('public.landing.features.title')}</h2>
                        <p className="text-md text-apple-gray-500 dark:text-apple-gray-400 mt-2">{t('public.landing.features.subtitle')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard i={0} icon={<Zap size={22} />} title={t('public.landing.features.orderManagement.title')} description={t('public.landing.features.orderManagement.description')} />
                        <FeatureCard i={1} icon={<Bell size={22} />} title={t('public.landing.features.notifications.title')} description={t('public.landing.features.notifications.description')} />
                        <FeatureCard i={2} icon={<DollarSign size={22} />} title={t('public.landing.features.payments.title')} description={t('public.landing.features.payments.description')} />
                        <FeatureCard i={3} icon={<Users size={22} />} title={t('public.landing.features.customers.title')} description={t('public.landing.features.customers.description')} />
                        <FeatureCard i={4} icon={<BarChart2 size={22} />} title={t('public.landing.features.dashboard.title')} description={t('public.landing.features.dashboard.description')} />
                        <FeatureCard i={5} icon={<Smartphone size={22} />} title={t('public.landing.features.access.title')} description={t('public.landing.features.access.description')} />
                    </div>
                </div>
            </section>

            {/* =================================================================== */}
            {/* SOCIAL PROOF                                                         */}
            {/* =================================================================== */}
            <section className="relative bg-apple-gray-50 dark:bg-apple-gray-950 py-20">
                <motion.div
                    variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }}
                    className="container mx-auto px-6 max-w-3xl text-center"
                >
                    <div className="flex justify-center gap-1 mb-5 text-amber-400">
                        {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
                    </div>
                    <blockquote className="text-xl md:text-2xl font-medium text-apple-gray-900 dark:text-white leading-relaxed">
                        “{t('public.landing.quote.text', 'PressMark replaced our paper tickets and three spreadsheets. Orders, payments and customer alerts now live in one clean dashboard.')}”
                    </blockquote>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-apple-blue to-sky-400 text-white font-semibold">SK</div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-apple-gray-900 dark:text-white">{t('public.landing.quote.author', 'Sarah K.')}</p>
                            <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">{t('public.landing.quote.role', 'Owner, Crisp & Clean Laundry')}</p>
                        </div>
                    </div>
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-apple-gray-500 dark:text-apple-gray-400">
                        <span className="inline-flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-500" /> {t('public.landing.badges.secure', 'Bank-grade security')}</span>
                        <span className="inline-flex items-center gap-2"><Clock size={18} className="text-apple-blue" /> {t('public.landing.badges.fast', 'Set up in minutes')}</span>
                        <span className="inline-flex items-center gap-2"><Smartphone size={18} className="text-apple-blue" /> {t('public.landing.badges.anywhere', 'Works on any device')}</span>
                    </div>
                </motion.div>
            </section>

            {/* =================================================================== */}
            {/* CTA — floating glass panel on dark gradient                          */}
            {/* =================================================================== */}
            <section className="relative overflow-hidden bg-[#070b1a] py-24">
                <motion.div
                    aria-hidden
                    className="absolute -top-16 left-1/4 h-72 w-72 rounded-full bg-apple-blue/30 blur-[100px]"
                    animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    aria-hidden
                    className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[100px]"
                    animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
                    transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative container mx-auto px-6">
                    <Float duration={8} distance={10}>
                        <motion.div
                            variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }}
                            className="max-w-3xl mx-auto rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-2xl px-6 py-14 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
                        >
                            <h2 className="text-3xl font-bold text-white">{t('public.landing.cta.title')}</h2>
                            <p className="text-lg text-slate-300 mt-2 mb-8 max-w-2xl mx-auto">{t('public.landing.cta.subtitle')}</p>
                            <Link
                                to="/signup"
                                className="group inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-semibold text-lg text-white bg-gradient-to-r from-apple-blue to-sky-500 shadow-lg shadow-apple-blue/40 hover:shadow-apple-blue/60 transition-all hover:-translate-y-0.5"
                            >
                                {t('public.landing.cta.startTrial')}
                                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                        </motion.div>
                    </Float>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
